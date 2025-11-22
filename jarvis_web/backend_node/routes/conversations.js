const express = require('express');
const router = express.Router();
const { ipcRequest } = require('../ipcBridge');

router.get('/', async (req, res) => {
    try {
        const sessions = await ipcRequest(req, 'get-sessions');
        res.json(sessions);
    } catch (error) {
        console.error('Failed to get sessions via IPC:', error);
        res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
});

router.post('/', async (req, res) => {
    try {
        const result = await ipcRequest(req, 'create-session', req.body);
        res.status(201).json({ ...result, message: 'Session created successfully' });
    } catch (error) {
        console.error('Failed to create session via IPC:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

router.get('/active', async (req, res) => {
    try {
        const session = await ipcRequest(req, 'get-active-session');
        res.json(session || null);
    } catch (error) {
        console.error('Failed to get active session via IPC:', error);
        res.status(500).json({ error: 'Failed to get active session' });
    }
});

router.get('/:session_id', async (req, res) => {
    try {
        const details = await ipcRequest(req, 'get-session-details', req.params.session_id);
        if (!details) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(details);
    } catch (error) {
        console.error(`Failed to get session details via IPC for ${req.params.session_id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve session details' });
    }
});

router.delete('/:session_id', async (req, res) => {
    try {
        await ipcRequest(req, 'delete-session', req.params.session_id);
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete session via IPC for ${req.params.session_id}:`, error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
    try {
        const sessions = await ipcRequest(req, 'search-sessions', { query });
        res.json(sessions);
    } catch (error) {
        console.error('Failed to search sessions via IPC:', error);
        res.status(500).json({ error: 'Failed to search sessions' });
    }
});

router.patch('/:session_id/notes', async (req, res) => {
    try {
        const { notes } = req.body;
        if (notes === undefined) {
            return res.status(400).json({ error: 'Notes field is required' });
        }
        await ipcRequest(req, 'update-session-notes', {
            id: req.params.session_id,
            notes
        });
        res.json({ success: true, message: 'Notes updated successfully' });
    } catch (error) {
        console.error(`Failed to update session notes via IPC for ${req.params.session_id}:`, error);
        res.status(500).json({ error: 'Failed to update session notes' });
    }
});

router.post('/:session_id/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message field is required' });
        }
        const result = await ipcRequest(req, 'assistant-chat', {
            sessionId: req.params.session_id,
            message
        });
        res.json(result);
    } catch (error) {
        console.error(`Failed to chat with assistant via IPC for ${req.params.session_id}:`, error);
        res.status(500).json({ error: 'Failed to chat with assistant' });
    }
});

module.exports = router; 