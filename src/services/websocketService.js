const { WebSocketServer } = require('ws');
const { EventEmitter } = require('events');

class WebSocketService extends EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Set();
    }

    initialize(server) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws) => {
            console.log('[WebSocket] Client connected');
            this.clients.add(ws);

            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', (message) => {
                try {
                    const parsed = JSON.parse(message);
                    this.emit('message', parsed, ws);
                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error);
                }
            });

            ws.on('close', () => {
                console.log('[WebSocket] Client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('[WebSocket] Client error:', error);
            });

            // Send initial connection success message
            this.send(ws, 'connection', { status: 'connected' });
        });

        // Heartbeat to keep connections alive and detect dead clients
        this.interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) return ws.terminate();

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        console.log('[WebSocket] WebSocket server initialized');
    }

    broadcast(type, data) {
        const message = JSON.stringify({ type, data });
        this.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }

    send(client, type, data) {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type, data }));
        }
    }

    close() {
        if (this.interval) clearInterval(this.interval);
        if (this.wss) this.wss.close();
    }
}

module.exports = new WebSocketService();
