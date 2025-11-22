'use client'

import { useState } from 'react'
import { Session, Summary, Transcript } from '@/utils/api'

interface MetadataPanelProps {
    session: Session
    summary?: Summary | null
    transcripts?: Transcript[]
}

export default function MetadataPanel({ session, summary, transcripts }: MetadataPanelProps) {
    const [summaryExpanded, setSummaryExpanded] = useState(false)
    const [transcriptExpanded, setTranscriptExpanded] = useState(false)

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            {/* Session Info */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Session Info</h3>
                <div className="text-xs text-gray-600 space-y-1">
                    <div>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(session.started_at * 1000).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>
                    <div>
                        <span className="font-medium">Time:</span>{' '}
                        {new Date(session.started_at * 1000).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </div>
                    <div>
                        <span className="font-medium">Type:</span>{' '}
                        <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${session.session_type === 'listen' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {session.session_type}
                        </span>
                    </div>
                    {session.ended_at && (
                        <div>
                            <span className="font-medium">Duration:</span>{' '}
                            {Math.round((session.ended_at - session.started_at) / 60)} min
                        </div>
                    )}
                </div>
            </div>

            {/* AI Summary */}
            {summary && (
                <div className="mb-6">
                    <button
                        onClick={() => setSummaryExpanded(!summaryExpanded)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2 hover:text-gray-900"
                    >
                        <span>AI Summary</span>
                        <svg
                            className={`w-4 h-4 transition-transform ${summaryExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {summaryExpanded && (
                        <div className="text-xs text-gray-600 space-y-2">
                            {summary.tldr && (
                                <p className="italic bg-blue-50 p-2 rounded">"{summary.tldr}"</p>
                            )}
                            {summary.bullet_json && JSON.parse(summary.bullet_json).length > 0 && (
                                <div>
                                    <div className="font-medium mb-1">Key Points:</div>
                                    <ul className="list-disc list-inside space-y-0.5 pl-2">
                                        {JSON.parse(summary.bullet_json).map((point: string, index: number) => (
                                            <li key={index}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {summary.action_json && JSON.parse(summary.action_json).length > 0 && (
                                <div>
                                    <div className="font-medium mb-1">Action Items:</div>
                                    <ul className="list-disc list-inside space-y-0.5 pl-2">
                                        {JSON.parse(summary.action_json).map((action: string, index: number) => (
                                            <li key={index}>{action}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Transcript */}
            {transcripts && transcripts.length > 0 && (
                <div>
                    <button
                        onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2 hover:text-gray-900"
                    >
                        <span>Transcript ({transcripts.length})</span>
                        <svg
                            className={`w-4 h-4 transition-transform ${transcriptExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {transcriptExpanded && (
                        <div className="text-xs text-gray-600 space-y-2 max-h-64 overflow-y-auto">
                            {transcripts.map((item) => (
                                <p key={item.id}>
                                    <span className="font-semibold capitalize">{item.speaker}:</span>{' '}
                                    {item.text}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
