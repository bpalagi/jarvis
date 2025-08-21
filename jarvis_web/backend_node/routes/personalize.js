const express = require('express');
const router = express.Router();
const { ipcRequest } = require('../ipcBridge');

router.get('/', async (req, res) => {
    try {
        const prompt = await ipcRequest(req, 'get-personalize-prompt');
        res.json(prompt);
    } catch (error) {
        console.error('Failed to get personalize prompt via IPC:', error);
        res.status(500).json({ error: 'Failed to retrieve personalize prompt' });
    }
});

router.put('/', async (req, res) => {
    try {
        await ipcRequest(req, 'update-personalize-prompt', req.body);
        res.json({ message: 'Personalize prompt updated successfully' });
    } catch (error) {
        console.error('Failed to update personalize prompt via IPC:', error);
        res.status(500).json({ error: 'Failed to update personalize prompt' });
    }
});

module.exports = router;