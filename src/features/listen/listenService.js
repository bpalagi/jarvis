const { BrowserWindow } = require('electron');
const EventEmitter = require('events');
const SttService = require('./stt/sttService');
const summaryService = require('./summary/summaryService');
const authService = require('../common/services/authService');
const sessionRepository = require('../common/repositories/session');
const sttRepository = require('./stt/repositories');
const summaryRepository = require('./summary/repositories');
const internalBridge = require('../../bridge/internalBridge');

class ListenService extends EventEmitter {
    constructor() {
        super();
        this.sttService = new SttService();
        this.summaryService = summaryService;
        this.currentSessionId = null;
        this.isInitializingSession = false;

        this.setupServiceCallbacks();
        console.log('[ListenService] Service instance created.');
    }

    setupServiceCallbacks() {
        // STT service callbacks
        this.sttService.setCallbacks({
            onTranscriptionComplete: (speaker, text) => {
                this.handleTranscriptionComplete(speaker, text);
            },
            onStatusUpdate: (status) => {
                this.sendToRenderer('update-status', status);
            }
        });

        // Summary service callbacks
        this.summaryService.setCallbacks({
            onAnalysisComplete: async (data) => {
                console.log('📊 Analysis completed:', data);
                // Update summary section when analysis is generated
                await this.updateSummaryInNotes();
            },
            onStatusUpdate: (status) => {
                this.sendToRenderer('update-status', status);
            }
        });
    }

    sendToRenderer(channel, data) {
        const { windowPool } = require('../../window/windowManager');
        const listenWindow = windowPool?.get('listen');

        if (listenWindow && !listenWindow.isDestroyed()) {
            listenWindow.webContents.send(channel, data);
        }
    }

    initialize() {
        this.setupIpcHandlers();
        console.log('[ListenService] Initialized and ready.');
    }

    async handleListenRequest(listenButtonText) {
        const { windowPool } = require('../../window/windowManager');
        const listenWindow = windowPool.get('listen');
        const header = windowPool.get('header');

        try {
            switch (listenButtonText) {
                case 'Listen':
                    console.log('[ListenService] changeSession to "Listen"');
                    internalBridge.emit('window:requestVisibility', { name: 'listen', visible: true });
                    await this.initializeSession();
                    if (listenWindow && !listenWindow.isDestroyed()) {
                        listenWindow.webContents.send('session-state-changed', { isActive: true });
                    }
                    break;

                case 'Stop':
                    console.log('[ListenService] changeSession to "Stop"');
                    await this.closeSession();
                    if (listenWindow && !listenWindow.isDestroyed()) {
                        listenWindow.webContents.send('session-state-changed', { isActive: false });
                    }
                    break;

                default:
                    throw new Error(`[ListenService] unknown listenButtonText: ${listenButtonText}`);
            }

            header.webContents.send('listen:changeSessionResult', { success: true });

        } catch (error) {
            console.error('[ListenService] error in handleListenRequest:', error);
            header.webContents.send('listen:changeSessionResult', { success: false });
            throw error;
        }
    }

    async handleTranscriptionComplete(speaker, text) {
        console.log(`[ListenService] Transcription complete: ${speaker} - ${text}`);

        // Save to database
        await this.saveConversationTurn(speaker, text);

        // Add to summary service for analysis
        this.summaryService.addConversationTurn(speaker, text);

        // Update markdown notes
        await this.updateSessionNotes(speaker, text);

        // Emit event for API consumers (Web UI)
        this.emit('transcription', { speaker, text, sessionId: this.currentSessionId });
    }

    async updateSessionNotes(speaker, text) {
        if (!this.currentSessionId) {
            return;
        }

        try {
            // Get current notes from the session
            const session = await sessionRepository.getById(this.currentSessionId);
            let notes = session?.notes || '';

            // Initialize notes if empty
            if (!notes.trim()) {
                notes = '# Live Notes\n\n## Transcript\n\n';
            }

            // Check if there's a Transcript section, if not add it
            if (!notes.includes('## Transcript')) {
                notes += '\n## Transcript\n\n';
            }

            // Append the new transcription to the end
            const newEntry = `**${speaker}:** ${text}\n\n`;
            notes += newEntry;

            // Update session with notes
            await sessionRepository.updateNotes(this.currentSessionId, notes);

            console.log(`[ListenService] Appended transcription to session notes for ${this.currentSessionId}`);
        } catch (error) {
            console.error('[ListenService] Failed to update session notes:', error);
        }
    }

    async updateSummaryInNotes() {
        if (!this.currentSessionId) {
            return;
        }

        try {
            // Get current notes and summary
            const session = await sessionRepository.getById(this.currentSessionId);
            const summary = await summaryRepository.getSummaryBySessionId(this.currentSessionId);

            if (!summary) {
                return; // No summary to add
            }

            let notes = session?.notes || '';

            // Generate summary markdown
            let summaryMarkdown = '## Summary\n\n';
            if (summary.tldr) {
                summaryMarkdown += `> ${summary.tldr}\n\n`;
            }

            if (summary.bullet_json) {
                try {
                    const bullets = JSON.parse(summary.bullet_json);
                    if (bullets && bullets.length > 0) {
                        summaryMarkdown += '### Key Points\n\n';
                        bullets.forEach(bullet => {
                            summaryMarkdown += `- ${bullet}\n`;
                        });
                        summaryMarkdown += '\n';
                    }
                } catch (e) {
                    console.error('Failed to parse bullet_json:', e);
                }
            }

            if (summary.action_json) {
                try {
                    const actions = JSON.parse(summary.action_json);
                    if (actions && actions.length > 0) {
                        summaryMarkdown += '### Action Items\n\n';
                        actions.forEach(action => {
                            summaryMarkdown += `- [ ] ${action}\n`;
                        });
                        summaryMarkdown += '\n';
                    }
                } catch (e) {
                    console.error('Failed to parse action_json:', e);
                }
            }

            // Check if there's already a Summary section and replace it
            const summaryRegex = /## Summary\n\n[\s\S]*?(?=\n## |\n# |$)/;
            if (summaryRegex.test(notes)) {
                notes = notes.replace(summaryRegex, summaryMarkdown);
            } else {
                // Insert summary after the title, before transcript
                if (notes.includes('## Transcript')) {
                    notes = notes.replace('## Transcript', summaryMarkdown + '## Transcript');
                } else if (notes.includes('# Live Notes')) {
                    notes = notes.replace('# Live Notes\n\n', `# Live Notes\n\n${summaryMarkdown}`);
                } else {
                    notes = `# Live Notes\n\n${summaryMarkdown}${notes}`;
                }
            }

            // Update session with notes
            await sessionRepository.updateNotes(this.currentSessionId, notes);

            console.log(`[ListenService] Updated summary section in notes for ${this.currentSessionId}`);
        } catch (error) {
            console.error('[ListenService] Failed to update summary in notes:', error);
        }
    }

    generateMarkdownNotes(transcripts, summary) {
        let markdown = '# Live Notes\n\n';

        // Add summary if available
        if (summary) {
            markdown += '## Summary\n\n';
            if (summary.tldr) {
                markdown += `> ${summary.tldr}\n\n`;
            }

            if (summary.bullet_json) {
                try {
                    const bullets = JSON.parse(summary.bullet_json);
                    if (bullets && bullets.length > 0) {
                        markdown += '### Key Points\n\n';
                        bullets.forEach(bullet => {
                            markdown += `- ${bullet}\n`;
                        });
                        markdown += '\n';
                    }
                } catch (e) {
                    console.error('Failed to parse bullet_json:', e);
                }
            }

            if (summary.action_json) {
                try {
                    const actions = JSON.parse(summary.action_json);
                    if (actions && actions.length > 0) {
                        markdown += '### Action Items\n\n';
                        actions.forEach(action => {
                            markdown += `- [ ] ${action}\n`;
                        });
                        markdown += '\n';
                    }
                } catch (e) {
                    console.error('Failed to parse action_json:', e);
                }
            }
        }

        // Add transcript
        if (transcripts && transcripts.length > 0) {
            markdown += '## Transcript\n\n';
            transcripts.forEach(transcript => {
                const speaker = transcript.speaker || 'Unknown';
                const text = transcript.text || '';
                markdown += `**${speaker}:** ${text}\n\n`;
            });
        }

        return markdown;
    }

    async saveConversationTurn(speaker, transcription) {
        if (!this.currentSessionId) {
            console.error('[DB] Cannot save turn, no active session ID.');
            return;
        }
        if (transcription.trim() === '') return;

        try {
            await sessionRepository.touch(this.currentSessionId);
            await sttRepository.addTranscript({
                sessionId: this.currentSessionId,
                speaker: speaker,
                text: transcription.trim(),
            });
            console.log(`[DB] Saved transcript for session ${this.currentSessionId}: (${speaker})`);
        } catch (error) {
            console.error('Failed to save transcript to DB:', error);
        }
    }

    async initializeNewSession() {
        try {
            // The UID is no longer passed to the repository method directly.
            // The adapter layer handles UID injection. We just ensure a user is available.
            const user = authService.getCurrentUser();
            if (!user) {
                // This case should ideally not happen as authService initializes a default user.
                throw new Error("Cannot initialize session: auth service not ready.");
            }

            this.currentSessionId = await sessionRepository.getOrCreateActive('listen');
            console.log(`[DB] New listen session ensured: ${this.currentSessionId}`);

            // Set session ID for summary service
            this.summaryService.setSessionId(this.currentSessionId);

            // Reset conversation history
            this.summaryService.resetConversationHistory();

            console.log('New conversation session started:', this.currentSessionId);
            return true;
        } catch (error) {
            console.error('Failed to initialize new session in DB:', error);
            this.currentSessionId = null;
            return false;
        }
    }

    async initializeSession(language = 'en') {
        if (this.isInitializingSession) {
            console.log('Session initialization already in progress.');
            return false;
        }

        this.isInitializingSession = true;
        this.sendToRenderer('session-initializing', true);
        this.sendToRenderer('update-status', 'Initializing sessions...');

        try {
            // Initialize database session
            const sessionInitialized = await this.initializeNewSession();
            if (!sessionInitialized) {
                throw new Error('Failed to initialize database session');
            }

            /* ---------- STT Initialization Retry Logic ---------- */
            const MAX_RETRY = 10;
            const RETRY_DELAY_MS = 300;   // 0.3 seconds

            let sttReady = false;
            for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
                try {
                    await this.sttService.initializeSttSessions(language);
                    sttReady = true;
                    break;                         // Exit on success
                } catch (err) {
                    console.warn(
                        `[ListenService] STT init attempt ${attempt} failed: ${err.message}`
                    );
                    if (attempt < MAX_RETRY) {
                        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
                    }
                }
            }
            if (!sttReady) throw new Error('STT init failed after retries');
            /* ------------------------------------------- */

            console.log('✅ Listen service initialized successfully.');

            this.sendToRenderer('update-status', 'Connected. Ready to listen.');

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize listen service:', error);
            this.sendToRenderer('update-status', 'Initialization failed.');
            return false;
        } finally {
            this.isInitializingSession = false;
            this.sendToRenderer('session-initializing', false);
            this.sendToRenderer('change-listen-capture-state', { status: "start" });
        }
    }

    async sendMicAudioContent(data, mimeType) {
        return await this.sttService.sendMicAudioContent(data, mimeType);
    }

    async startMacOSAudioCapture() {
        if (process.platform !== 'darwin') {
            throw new Error('macOS audio capture only available on macOS');
        }
        return await this.sttService.startMacOSAudioCapture();
    }

    async stopMacOSAudioCapture() {
        this.sttService.stopMacOSAudioCapture();
    }

    isSessionActive() {
        return this.sttService.isSessionActive();
    }

    async closeSession() {
        try {
            this.sendToRenderer('change-listen-capture-state', { status: "stop" });
            internalBridge.emit('window:requestVisibility', { name: 'listen', visible: false }); // Added this line
            // Close STT sessions
            await this.sttService.closeSessions();

            await this.stopMacOSAudioCapture();

            // End database session
            if (this.currentSessionId) {
                await sessionRepository.end(this.currentSessionId);
                console.log(`[DB] Session ${this.currentSessionId} ended.`);
            }

            // Reset state
            this.currentSessionId = null;
            this.summaryService.resetConversationHistory();

            console.log('Listen service session closed.');
            return { success: true };
        } catch (error) {
            console.error('Error closing listen service session:', error);
            return { success: false, error: error.message };
        }
    }

    getCurrentSessionData() {
        return {
            sessionId: this.currentSessionId,
            conversationHistory: this.summaryService.getConversationHistory(),
            totalTexts: this.summaryService.getConversationHistory().length,
            analysisData: this.summaryService.getCurrentAnalysisData(),
        };
    }

    getConversationHistory() {
        return this.summaryService.getConversationHistory();
    }

    async toggleListenSessionFromShortcut() {
        const { windowPool } = require('../../window/windowManager');
        const header = windowPool.get('header');
        try {
            if (this.sttService.isSessionActive()) {
                console.log('[ListenService] Shortcut: Session active, stopping.');
                await this.closeSession();
            } else {
                console.log('[ListenService] Shortcut: Session inactive, starting.');
                internalBridge.emit('window:requestVisibility', { name: 'listen', visible: true }); // Ensure window is visible when starting
                await this.initializeSession();
            }
            header.webContents.send('listen:changeSessionResult', { success: true });
        } catch (error) {
            console.error('[ListenService] Shortcut toggle failed:', error);
            header.webContents.send('listen:changeSessionResult', { success: false, error: error.message });
        }
    }

    _createHandler(asyncFn, successMessage, errorMessage) {
        return async (...args) => {
            try {
                const result = await asyncFn.apply(this, args);
                if (successMessage) console.log(successMessage);
                // `startMacOSAudioCapture`는 성공 시 { success, error } 객체를 반환하지 않으므로,
                // 핸들러가 일관된 응답을 보내도록 여기서 success 객체를 반환합니다.
                // 다른 함수들은 이미 success 객체를 반환합니다.
                return result && typeof result.success !== 'undefined' ? result : { success: true };
            } catch (e) {
                console.error(errorMessage, e);
                return { success: false, error: e.message };
            }
        };
    }

    // `_createHandler`를 사용하여 핸들러들을 동적으로 생성합니다.
    handleSendMicAudioContent = this._createHandler(
        this.sendMicAudioContent,
        null,
        'Error sending user audio:'
    );

    handleStartMacosAudio = this._createHandler(
        async () => {
            if (process.platform !== 'darwin') {
                return { success: false, error: 'macOS audio capture only available on macOS' };
            }
            if (this.sttService.isMacOSAudioRunning?.()) {
                return { success: false, error: 'already_running' };
            }
            await this.startMacOSAudioCapture();
            return { success: true, error: null };
        },
        'macOS audio capture started.',
        'Error starting macOS audio capture:'
    );

    handleStopMacosAudio = this._createHandler(
        this.stopMacOSAudioCapture,
        'macOS audio capture stopped.',
        'Error stopping macOS audio capture:'
    );

    handleUpdateGoogleSearchSetting = this._createHandler(
        async (enabled) => {
            console.log('Google Search setting updated to:', enabled);
        },
        null,
        'Error updating Google Search setting:'
    );

    // ── API Adapters ─────────────────────────────────────────────────────────────

    async startTranscription(sessionId, audioSource) {
        console.log(`[ListenService] API startTranscription request for session ${sessionId}`);
        // Initialize session (starts STT and DB session)
        const success = await this.initializeSession();
        if (!success) {
            throw new Error('Failed to initialize transcription session');
        }
        return { success: true };
    }

    async stopTranscription(sessionId) {
        console.log(`[ListenService] API stopTranscription request for session ${sessionId}`);
        return await this.closeSession();
    }

    onTranscriptionResult(sessionId, listener) {
        // In the future we could filter by sessionId, but for now we emit all events
        this.on('transcription', listener);
    }

    removeTranscriptionListener(sessionId, listener) {
        this.removeListener('transcription', listener);
    }
}

const listenService = new ListenService();
module.exports = listenService;