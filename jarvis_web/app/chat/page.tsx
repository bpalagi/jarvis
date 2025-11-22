'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket, wsClient } from '../../utils/websocket';
import { Send, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type ChatState = {
    isVisible: boolean;
    isLoading: boolean;
    isStreaming: boolean;
    currentQuestion: string;
    currentResponse: string;
    showTextInput: boolean;
};

export default function ChatPage() {
    const [state, setState] = useState<ChatState>({
        isVisible: true,
        isLoading: false,
        isStreaming: false,
        currentQuestion: '',
        currentResponse: '',
        showTextInput: true,
    });
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Subscribe to chat state
    useWebSocket('chat-state', (data: ChatState) => {
        setState(data);
        setError(null); // Clear error on state update
    });

    // Subscribe to chat errors
    useWebSocket('chat-error', (data: { error: string }) => {
        setError(data.error);
        setState(prev => ({ ...prev, isLoading: false, isStreaming: false }));
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.currentResponse, state.currentQuestion]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        wsClient.send('command', {
            action: 'ask-question',
            question: input
        });
        setInput('');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <header className="flex items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold">Assistant</h1>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full p-6">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4"
                >
                    {!state.currentQuestion && !state.isLoading && !error && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p>Ask me anything...</p>
                        </div>
                    )}

                    {state.currentQuestion && (
                        <div className="flex justify-end">
                            <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
                                <p>{state.currentQuestion}</p>
                            </div>
                        </div>
                    )}

                    {(state.currentResponse || state.isLoading || state.isStreaming) && (
                        <div className="flex justify-start">
                            <div className="max-w-[85%] bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm prose prose-sm">
                                {state.currentResponse ? (
                                    <ReactMarkdown>{state.currentResponse}</ReactMarkdown>
                                ) : (
                                    <div className="flex items-center space-x-2 text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex justify-center">
                            <div className="flex items-center bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 text-sm">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                {error}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="mt-4">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            disabled={state.isLoading || state.isStreaming}
                            className="w-full px-5 py-4 pr-12 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || state.isLoading || state.isStreaming}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                        >
                            {state.isLoading || state.isStreaming ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Jarvis can see your screen and hear your conversation context.
                    </p>
                </div>
            </main>
        </div>
    );
}
