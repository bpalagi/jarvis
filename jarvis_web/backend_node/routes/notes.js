// backend_node/routes/notes.js
const express = require('express');
const router = express.Router();

// Repository for sessions (assumes path relative to project root)
const sessionRepository = require('../../../src/features/common/repositories/session');

// Get notes for a session
router.get('/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = await sessionRepository.getById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ notes: session.notes || '' });
    } catch (error) {
        console.error('[Notes API] Get error', error);
        res.status(500).json({ error: error.message });
    }
});

// Update notes for a session
router.put('/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { notes } = req.body;
    if (typeof notes !== 'string') {
        return res.status(400).json({ error: 'Notes must be a string' });
    }
    try {
        await sessionRepository.updateNotes(sessionId, notes);
        res.json({ success: true, message: 'Notes updated' });
    } catch (error) {
        console.error('[Notes API] Update error', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
