const { createLLM } = require('../common/ai/factory');
const modelStateService = require('../common/services/modelStateService');
const sessionRepository = require('../common/repositories/session');
const sttRepository = require('../listen/stt/repositories');
const listenService = require('../listen/listenService');
const { desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.log('[AssistantService] Sharp module not available, will use fallback image processing');
}

class AssistantService {
    constructor() {
        this.chatHistory = {}; // sessionId -> [{role, content}]
    }

    async captureScreenshot() {
        if (process.platform === 'darwin') {
            try {
                const tempPath = path.join(os.tmpdir(), `assistant-screenshot-${Date.now()}.jpg`);
                await execFilePromise('screencapture', ['-x', '-t', 'jpg', tempPath]);
                const imageBuffer = await fs.promises.readFile(tempPath);
                await fs.promises.unlink(tempPath);

                if (sharp) {
                    const resizedBuffer = await sharp(imageBuffer)
                        .resize({ height: 384 })
                        .jpeg({ quality: 80 })
                        .toBuffer();
                    return resizedBuffer.toString('base64');
                }
                return imageBuffer.toString('base64');
            } catch (error) {
                console.error('[AssistantService] Screenshot capture failed:', error);
                return null;
            }
        }

        // desktopCapturer fallback
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 }
            });
            if (sources.length > 0) {
                const buffer = sources[0].thumbnail.toJPEG(70);
                return buffer.toString('base64');
            }
        } catch (error) {
            console.error('[AssistantService] desktopCapturer failed:', error);
        }
        return null;
    }

    async handleChat(sessionId, userMessage) {
        if (!this.chatHistory[sessionId]) {
            this.chatHistory[sessionId] = [];
        }

        // 1. Get Context
        const transcripts = await sttRepository.getAllTranscriptsBySessionId(sessionId);
        const session = await sessionRepository.getById(sessionId);
        const currentNotes = session.notes || "";

        const transcriptText = transcripts
            .map(t => `${t.speaker}: ${t.text}`)
            .join('\n');

        // 2. Capture Screenshot
        const screenshotBase64 = await this.captureScreenshot();

        // 3. Build System Prompt
        const systemPrompt = `
You are an intelligent Live Note-Taking Assistant.
You are helping a user who is currently in a meeting/session.
You have access to the live transcript, the current notes, and a screenshot of their screen.

CONTEXT:
---
TRANSCRIPT:
${transcriptText.slice(-5000)} 
(Truncated to last 5000 chars)
---
CURRENT NOTES:
${currentNotes}
---
${screenshotBase64 ? 'SCREENSHOT: You have access to a screenshot of the user\'s screen attached to this message.' : 'SCREENSHOT: Not available.'}
---

YOUR GOAL:
Help the user take better notes. 
- Answer questions about the conversation.
- If the user asks you to modify the notes, output a JSON object describing the change.
- Otherwise, just reply with text.

TOOLS:
If you want to modify the notes, your response must be ONLY a JSON object with this structure:
{
  "tool": "update_notes",
  "action": "append" | "replace", 
  "content": "text to append or replace with"
}

- "append": Adds text to the end of the notes.
- "replace": Replaces the ENTIRE notes content (use carefully, only if asked to reformat everything).

If you just want to chat, reply with normal text.
`;

        // 4. Call LLM with screenshot if available
        const userMessageContent = screenshotBase64
            ? [
                { type: 'text', text: userMessage },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` } }
            ]
            : userMessage;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.chatHistory[sessionId].slice(-10), // Last 10 turns
            { role: 'user', content: userMessageContent }
        ];

        const modelInfo = await modelStateService.getCurrentModelInfo('llm');
        const llm = createLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
        });

        const response = await llm.chat(messages);
        const aiMessage = response.content;

        // 4. Handle Tool Use (JSON parsing)
        let finalResponse = aiMessage;
        let noteUpdate = null;

        try {
            if (aiMessage.trim().startsWith('{')) {
                const toolCall = JSON.parse(aiMessage);
                if (toolCall.tool === 'update_notes') {
                    if (toolCall.action === 'append') {
                        const newNotes = currentNotes + '\n\n' + toolCall.content;
                        await sessionRepository.updateNotes(sessionId, newNotes);
                        noteUpdate = newNotes;
                        finalResponse = "I've updated the notes.";
                    } else if (toolCall.action === 'replace') {
                        await sessionRepository.updateNotes(sessionId, toolCall.content);
                        noteUpdate = toolCall.content;
                        finalResponse = "I've rewritten the notes.";
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse AI tool call", e);
            // Treat as normal text if parse fails
        }

        // 5. Update History
        this.chatHistory[sessionId].push({ role: 'user', content: userMessage });
        this.chatHistory[sessionId].push({ role: 'assistant', content: finalResponse });

        return {
            message: finalResponse,
            noteUpdate: noteUpdate
        };
    }
}

const assistantService = new AssistantService();
module.exports = assistantService;
