'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRedirectIfNotAuth } from '@/utils/auth'
import {
  UserProfile,
  Session,
  getSessions,
  deleteSession,
  getActiveSession,
  updateSessionNotes,
} from '@/utils/api'

export default function ActivityPage() {
  const userInfo = useRedirectIfNotAuth() as UserProfile | null;
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const fetchSessions = async () => {
    try {
      const fetchedSessions = await getSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActiveSession = async () => {
    try {
      const active = await getActiveSession();
      setActiveSession(active);
      if (active?.notes) {
        setEditedNotes(active.notes);
      }
    } catch (error) {
      console.error('Failed to fetch active session:', error);
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchActiveSession()
    
    // Poll for active session updates every 5 seconds
    const interval = setInterval(fetchActiveSession, 5000);
    return () => clearInterval(interval);
  }, [])

  // Filter out active session from past activity
  const pastSessions = sessions.filter(s => !activeSession || s.id !== activeSession.id);

  const handleSaveNotes = async () => {
    if (!activeSession) return;
    
    setIsSavingNotes(true);
    try {
      await updateSessionNotes(activeSession.id, editedNotes);
      setActiveSession({ ...activeSession, notes: editedNotes });
      setIsEditingNotes(false);
    } catch (error) {
      alert('Failed to save notes');
      console.error(error);
    } finally {
      setIsSavingNotes(false);
    }
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this activity? This cannot be undone.')) return;
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions(sessions => sessions.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
    } catch (error) {
      alert('Failed to delete activity.');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  }

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering for the preview
    const lines = markdown.split('\n');
    const elements: JSX.Element[] = [];
    let inList = false;
    let inOrderedList = false;
    
    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.startsWith('# ')) {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-900">{trimmedLine.substring(2)}</h1>);
      } else if (trimmedLine.startsWith('## ')) {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        elements.push(<h2 key={i} className="text-xl font-semibold mt-5 mb-2 text-gray-800">{trimmedLine.substring(3)}</h2>);
      } else if (trimmedLine.startsWith('### ')) {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        elements.push(<h3 key={i} className="text-lg font-medium mt-4 mb-2 text-gray-700">{trimmedLine.substring(4)}</h3>);
      }
      // Checkbox list items
      else if (trimmedLine.startsWith('- [ ] ') || trimmedLine.startsWith('- [x] ')) {
        const checked = trimmedLine.startsWith('- [x] ');
        const text = checked ? trimmedLine.substring(6) : trimmedLine.substring(6);
        elements.push(
          <div key={i} className="flex items-start ml-4 my-1">
            <input type="checkbox" checked={checked} disabled className="mt-1 mr-2 cursor-not-allowed" />
            <span className={checked ? 'line-through text-gray-500' : 'text-gray-700'}>{text}</span>
          </div>
        );
      }
      // Bullet list items
      else if (trimmedLine.startsWith('- ')) {
        if (!inList) {
          inList = true;
        }
        elements.push(<li key={i} className="ml-6 my-1 list-disc text-gray-700">{trimmedLine.substring(2)}</li>);
      }
      // Ordered list items
      else if (/^\d+\.\s/.test(trimmedLine)) {
        if (!inOrderedList) {
          inOrderedList = true;
        }
        const text = trimmedLine.replace(/^\d+\.\s/, '');
        elements.push(<li key={i} className="ml-6 my-1 list-decimal text-gray-700">{text}</li>);
      }
      // Blockquote
      else if (trimmedLine.startsWith('> ')) {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-300 pl-4 py-2 my-2 italic text-gray-600 bg-blue-50">
            {trimmedLine.substring(2)}
          </blockquote>
        );
      }
      // Bold speaker format: **Speaker:** text
      else if (/^\*\*(.+?):\*\*\s/.test(trimmedLine)) {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        const match = trimmedLine.match(/^\*\*(.+?):\*\*\s(.*)$/);
        if (match) {
          elements.push(
            <p key={i} className="my-1">
              <strong className="text-gray-900">{match[1]}:</strong>{' '}
              <span className="text-gray-700">{match[2]}</span>
            </p>
          );
        }
      }
      // Code block markers (simple handling)
      else if (trimmedLine.startsWith('```')) {
        // Skip code block markers for now
      }
      // Regular paragraph
      else if (trimmedLine) {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        // Handle inline formatting
        let text = trimmedLine;
        // Bold: **text**
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text*
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Inline code: `code`
        text = text.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
        
        elements.push(
          <p key={i} className="my-1 text-gray-700" dangerouslySetInnerHTML={{ __html: text }} />
        );
      }
      // Empty line
      else {
        if (inList || inOrderedList) {
          inList = false;
          inOrderedList = false;
        }
        elements.push(<div key={i} className="h-2" />);
      }
    });
    
    return elements;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-2xl text-gray-600">
            {getGreeting()}, {userInfo.display_name}
          </h1>
        </div>

        {/* Active Session Section */}
        {activeSession && (
          <div className="mb-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 flex items-center">
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    Live Session
                  </h2>
                  <p className="text-sm text-blue-700 mt-1">
                    Started {new Date(activeSession.started_at * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isEditingNotes && (
                    <button
                      onClick={() => {
                        setIsEditingNotes(true);
                        setEditedNotes(activeSession.notes || '');
                      }}
                      className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Edit Notes
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(activeSession.id)}
                    disabled={deletingId === activeSession.id}
                    className={`px-3 py-1 rounded text-sm font-medium border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors ${deletingId === activeSession.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {deletingId === activeSession.id ? 'Deleting...' : 'End Session'}
                  </button>
                </div>
              </div>

              {isEditingNotes ? (
                <div className="space-y-4">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Edit your notes in Markdown format..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className={`px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${isSavingNotes ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNotes(false);
                        setEditedNotes(activeSession.notes || '');
                      }}
                      className="px-4 py-2 rounded text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 prose prose-sm max-w-none">
                  {activeSession.notes ? (
                    <div className="text-gray-800">
                      {renderMarkdown(activeSession.notes)}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No notes yet. Notes will appear here as the session progresses.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Your Past Activity
          </h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading conversations...</p>
            </div>
          ) : pastSessions.length > 0 ? (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div key={session.id} className="block bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Link href={`/activity/details?sessionId=${session.id}`} className="text-lg font-medium text-gray-900 hover:underline">
                        {session.title || `Conversation - ${new Date(session.started_at * 1000).toLocaleDateString()}`}
                      </Link>
                      <div className="text-sm text-gray-500">
                        {new Date(session.started_at * 1000).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                      className={`ml-4 px-3 py-1 rounded text-xs font-medium border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors ${deletingId === session.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {deletingId === session.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.session_type === 'listen' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {session.session_type || 'ask'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white rounded-lg p-12">
              <p className="text-gray-500 mb-4">
                No conversations yet. Start a conversation in the desktop app to see your activity here.
              </p>
              <div className="text-sm text-gray-400">
                💡 Tip: Use the desktop app to have AI-powered conversations that will appear here automatically.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 