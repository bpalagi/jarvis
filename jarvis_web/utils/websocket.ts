import { useEffect, useState } from 'react';

type WebSocketMessage = {
    type: string;
    data: any;
};

type WebSocketHandler = (data: any) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: Map<string, Set<WebSocketHandler>> = new Map();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isConnecting = false;
    private url = 'ws://localhost:3001'; // API port where we attached WS

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

        this.isConnecting = true;
        console.log('[WebSocket] Connecting to', this.url);

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('[WebSocket] Connected');
            this.isConnecting = false;
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        };

        this.ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                const { type, data } = message;

                const typeHandlers = this.handlers.get(type);
                if (typeHandlers) {
                    typeHandlers.forEach(handler => handler(data));
                }
            } catch (error) {
                console.error('[WebSocket] Error parsing message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('[WebSocket] Disconnected');
            this.isConnecting = false;
            this.ws = null;
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
            this.ws?.close();
        };
    }

    scheduleReconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, 3000);
    }

    subscribe(type: string, handler: WebSocketHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);

        // Auto-connect if not connected
        if (!this.ws) this.connect();

        return () => {
            this.handlers.get(type)?.delete(handler);
        };
    }

    send(type: string, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        } else {
            console.warn('[WebSocket] Not connected, cannot send:', type);
        }
    }
}

export const wsClient = new WebSocketClient();

export function useWebSocket(type: string, handler: WebSocketHandler) {
    useEffect(() => {
        const unsubscribe = wsClient.subscribe(type, handler);
        return unsubscribe;
    }, [type, handler]);
}
