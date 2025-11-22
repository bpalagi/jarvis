'use client'

import { useState, useEffect, useCallback } from 'react'
import { updateSessionNotes } from '@/utils/api'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(
    () => import('@uiw/react-md-editor'),
    { ssr: false }
)

interface NoteEditorProps {
    initialNotes: string
    sessionId: string
    autoSaveDelay?: number
    placeholder?: string
    className?: string
}

export default function NoteEditor({
    initialNotes,
    sessionId,
    autoSaveDelay = 2000,
    placeholder = 'Start taking notes...',
    className = '',
}: NoteEditorProps) {
    const [notes, setNotes] = useState(initialNotes)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null)
    const [lastSavedNotes, setLastSavedNotes] = useState(initialNotes)

    // Update local state when initialNotes changes, but only if:
    // 1. User isn't currently typing (no pending save), AND
    // 2. The new notes are different from what we last saved (to avoid overwriting with stale data)
    useEffect(() => {
        // If there's no pending save and the incoming notes are different from our current state
        if (!saveTimeoutId && initialNotes !== notes && saveStatus !== 'saving') {
            setNotes(initialNotes)
            setLastSavedNotes(initialNotes)
        }
    }, [initialNotes, saveTimeoutId, notes, saveStatus])

    const saveNotes = useCallback(async (content: string) => {
        setSaveStatus('saving')
        try {
            await updateSessionNotes(sessionId, content)
            setLastSavedNotes(content)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            console.error('Failed to save notes:', error)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
        }
    }, [sessionId])

    const handleChange = (value?: string) => {
        const newNotes = value || ''
        setNotes(newNotes)

        // Clear existing timeout
        if (saveTimeoutId) {
            clearTimeout(saveTimeoutId)
        }

        // Set new timeout for auto-save
        const timeoutId = setTimeout(() => {
            saveNotes(newNotes)
        }, autoSaveDelay)

        setSaveTimeoutId(timeoutId)
    }

    return (
        <div className={`flex flex-col ${className}`} data-color-mode="light">
            <div className="flex justify-end mb-2">
                <div className="text-xs text-right">
                    {saveStatus === 'saving' && (
                        <span className="text-gray-500">Saving...</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-green-600">✓ Saved</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-600">Failed to save. Retrying...</span>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <MDEditor
                    value={notes}
                    onChange={handleChange}
                    preview="edit"
                    height="100%"
                    visibleDragbar={false}
                    hideToolbar={false}
                    textareaProps={{
                        placeholder: placeholder,
                    }}
                />
            </div>
        </div>
    )
}
