const chatService = require('../services/chatService');

class ChatController {
    async chat(req, res) {
        try {
            const { sessionId, prompt, system } = req.body;
            if (!sessionId?.trim() || !prompt?.trim()) {
                return res.status(400).json({ error: 'sessionId and prompt are required' });
            }
            const result = await chatService.chatWithSession(sessionId, prompt, system);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ error: 'Failed to generate AI response', message: err.message });
        }
    }

    async streamChat(req, res) {
        const { sessionId, prompt, system } = req.body;
        if (!sessionId?.trim() || !prompt?.trim()) {
            return res.status(400).json({ error: 'sessionId and prompt are required' });
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        try {
            for await (const chunk of chatService.streamChatWithSession(sessionId, prompt, system)) {
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
            res.write(`event: done\ndata: ${JSON.stringify({ sessionId })}\n\n`);
            res.end();
        } catch (err) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
            res.end();
        }
    }
    async chatWithTools(req, res) {
        try {
            const { sessionId, prompt, system } = req.body;
            if (!sessionId?.trim() || !prompt?.trim()) {
                return res.status(400).json({ error: 'sessionId and prompt are required' });
            }
            const result = await chatService.chatWithToolsSession(sessionId, prompt, system);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ error: 'Tool chat failed', message: err.message });
        }
    }

    async resetChat(req, res) {
        const { sessionId } = req.params;
        res.json({ success: true, data: chatService.resetChatSession(sessionId) });
    }
}

module.exports = new ChatController(); 