'use client';

import { useEffect, useState, useRef } from 'react';
import { useWebSocket, wsClient } from '../../utils/websocket';
import { Mic, MicOff, FileText, Activity } from 'lucide-react';
import NoteEditor from '@/components/NoteEditor';
import { getActiveSession, Session } from '@/utils/api';

type Transcript = {
    speaker: 'user' | 'system';
    text: string;
    timestamp: number;
    isFinal: boolean;
};

const SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;
const AUDIO_CHUNK_DURATION = 0.1;

export default function LivePage() {
    const [isListening, setIsListening] = useState(false);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState<string>('');
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [sessionNotes, setSessionNotes] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        getActiveSession().then(session => {
            if (session) {
                setActiveSession(session);
                setSessionNotes(session.notes || '');
                setIsListening(true);
            }
        }).catch(console.error);
    }, []);

    useWebSocket('listen-status', (data: { isListening: boolean }) => {
        setIsListening(data.isListening);
        if (data.isListening && !activeSession) {
            getActiveSession().then(setActiveSession).catch(console.error);
        }
    });

    useWebSocket('listen-data', (data: any) => {
        console.log('[LivePage] Received listen-data:', data);
        if (data.type === 'transcript') {
            if (data.isFinal) {
                setTranscripts(prev => [...prev, {
                    speaker: data.speaker || 'user',
                    text: data.text,
                    timestamp: Date.now(),
                    isFinal: true
                }]);
                setCurrentTranscript('');
            } else {
                setCurrentTranscript(data.text);
            }
        }
    });

    useWebSocket('notes-update', (data: { sessionId: string, notes: string }) => {
        if (activeSession && data.sessionId === activeSession.id) {
            setSessionNotes(data.notes);
        }
    });

    useWebSocket('listen-error', (data: { error: string }) => {
        alert(`Failed to start listening: ${data.error}`);
        setIsListening(false);
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcripts, currentTranscript]);

    const startMicrophoneCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });

            micStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
            await audioContext.resume();
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

            let audioBuffer: number[] = [];
            const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                audioBuffer.push(...Array.from(inputData));

                while (audioBuffer.length >= samplesPerChunk) {
                    const chunk = audioBuffer.splice(0, samplesPerChunk);
                    const float32Array = new Float32Array(chunk);
                    const int16Array = convertFloat32ToInt16(float32Array);
                    const base64Data = arrayBufferToBase64(int16Array.buffer as ArrayBuffer);

                    wsClient.send('mic-audio', {
                        data: base64Data,
                        mimeType: 'audio/pcm;rate=24000'
                    });
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            audioContextRef.current = audioContext;
            audioProcessorRef.current = processor;

            console.log('[LivePage] Microphone capture started');
        } catch (error) {
            console.error('[LivePage] Failed to start microphone:', error);
        }
    };

    const stopMicrophoneCapture = () => {
        if (audioProcessorRef.current) {
            audioProcessorRef.current.disconnect();
            audioProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
        console.log('[LivePage] Microphone capture stopped');
    };

    const toggleListening = async () => {
        if (isListening) {
            wsClient.send('command', { action: 'stop-listening' });
            stopMicrophoneCapture();
        } else {
            wsClient.send('command', { action: 'start-listening' });
            setTimeout(() => {
                startMicrophoneCapture();
            }, 1000);
        }
    };

    useEffect(() => {
        return () => {
            stopMicrophoneCapture();
        };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                    <Activity className={`w-6 h-6 ${isListening ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                    <div>
                        <h1 className="text-xl font-semibold">Live Session</h1>
                        {activeSession && <p className="text-xs text-gray-500">{activeSession.title}</p>}
                    </div>
                </div>
                <button
                    onClick={toggleListening}
                    className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${isListening
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                        }`}
                >
                    {isListening ? (
                        <>
                            <MicOff className="w-4 h-4 mr-2" />
                            Stop Listening
                        </>
                    ) : (
                        <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Listening
                        </>
                    )}
                </button>
            </header>

            <main className="flex-1 overflow-hidden flex">
                <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50">
                    <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Live Transcript</h2>
                    </div>
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4"
                    >
                        {transcripts.length === 0 && !currentTranscript && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FileText className="w-12 h-12 mb-4 opacity-20" />
                                <p>Waiting for speech...</p>
                            </div>
                        )}

                        {transcripts.map((t, i) => (
                            <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${t.speaker === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                    }`}>
                                    <p className="text-xs opacity-75 mb-1 uppercase tracking-wider font-medium">
                                        {t.speaker}
                                    </p>
                                    <p className="leading-relaxed">{t.text}</p>
                                </div>
                            </div>
                        ))}

                        {currentTranscript && (
                            <div className="flex justify-end animate-pulse">
                                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-blue-600/80 text-white rounded-tr-sm">
                                    <p className="text-xs opacity-75 mb-1 uppercase tracking-wider font-medium">
                                        Listening...
                                    </p>
                                    <p className="leading-relaxed">{currentTranscript}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Session Notes</h2>
                        <div className="text-xs text-gray-400">Auto-saving</div>
                    </div>
                    <div className="flex-1 overflow-hidden p-4">
                        {activeSession ? (
                            <NoteEditor
                                initialNotes={sessionNotes}
                                sessionId={activeSession.id}
                                className="h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <p>Start a session to take notes</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
