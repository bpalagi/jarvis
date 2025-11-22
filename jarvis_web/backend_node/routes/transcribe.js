// backend_node/routes/transcribe.js
const express = require('express');
const router = express.Router();

// Import the listen service (transcription logic)
const listenService = require('../../../src/features/listen/listenService');

// Start transcription for a given session
router.post('/start', async (req, res) => {
    const { sessionId, audioSource } = req.body;
    try {
        // listenService.startTranscription is assumed to exist; adjust as needed
        await listenService.startTranscription(sessionId, audioSource);
        res.json({ success: true, message: 'Transcription started' });
    } catch (err) {
        console.error('[Transcribe] start error', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Stop transcription for a given session
router.post('/stop', async (req, res) => {
    const { sessionId } = req.body;
    try {
        await listenService.stopTranscription(sessionId);
        res.json({ success: true, message: 'Transcription stopped' });
    } catch (err) {
        console.error('[Transcribe] stop error', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Stream live transcription results via Server‑Sent Events (SSE)
router.get('/stream/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    const listener = (data) => {
        // data is { speaker, text, sessionId }
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Assume listenService can register a callback for live results
    listenService.onTranscriptionResult(sessionId, listener);

    // Cleanup on client disconnect
    req.on('close', () => {
        listenService.removeTranscriptionListener(sessionId, listener);
        res.end();
    });
});

module.exports = router;
