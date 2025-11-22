# Live Session Transcription Fix

## Problem
When making manual edits in the Live Session view, the transcription would stop being added to the Notes document. The user wanted the Notes to be created by:
1. Manual edits
2. Transcription updates (ongoing)
3. Language Model agent assistance

## Root Cause
The issue had two main components:

### 1. Backend: Notes Regeneration
The backend `listenService.js` was **regenerating** the entire notes from scratch every time a new transcription came in. This meant:
- Any manual edits by the user were lost
- The notes were replaced rather than appended to

### 2. Frontend: Edit Blocking
The frontend `NoteEditor.tsx` component was blocking incoming updates when the user was editing:
- When a user made an edit, a `saveTimeoutId` was set for auto-save
- The component wouldn't accept incoming updates while this timeout was active
- This prevented transcriptions from being visible during the auto-save delay (2 seconds)

## Solution

### Backend Changes (`listenService.js`)

#### 1. Modified `updateSessionNotes()` to append instead of regenerate
**Before:**
```javascript
async updateSessionNotes() {
    // Get all transcripts and regenerate entire notes from scratch
    const transcripts = await sttRepository.getAllTranscriptsBySessionId(this.currentSessionId);
    const summary = await summaryRepository.getSummaryBySessionId(this.currentSessionId);
    const notes = this.generateMarkdownNotes(transcripts, summary);
    await sessionRepository.updateNotes(this.currentSessionId, notes);
}
```

**After:**
```javascript
async updateSessionNotes(speaker, text) {
    // Get current notes and append new transcription
    const session = await sessionRepository.getById(this.currentSessionId);
    let notes = session?.notes || '';
    
    // Initialize or append to transcript section
    if (!notes.trim()) {
        notes = '# Live Notes\n\n## Transcript\n\n';
    }
    if (!notes.includes('## Transcript')) {
        notes += '\n## Transcript\n\n';
    }
    
    // Append new transcription
    notes += `**${speaker}:** ${text}\n\n`;
    await sessionRepository.updateNotes(this.currentSessionId, notes);
}
```

#### 2. Added `updateSummaryInNotes()` for AI analysis updates
Created a separate method to update just the Summary section while preserving:
- Manual edits
- Existing transcripts
- Other content

This method uses regex to find and replace existing summary sections or intelligently insert new ones.

### Frontend Changes (`NoteEditor.tsx`)

#### Modified the `useEffect` hook for intelligent merging
**Before:**
```typescript
useEffect(() => {
    if (!saveTimeoutId && initialNotes !== notes && saveStatus !== 'saving') {
        setNotes(initialNotes)
    }
}, [initialNotes, saveTimeoutId, notes, saveStatus])
```

**After:**
```typescript
useEffect(() => {
    if (initialNotes === notes) return;
    
    if (saveTimeoutId) {
        // If new notes are longer and contain current notes as prefix,
        // it's an append operation (transcription), so accept it
        if (initialNotes.length > notes.length && initialNotes.startsWith(notes)) {
            setNotes(initialNotes)
        }
        // Otherwise keep user's edits
    } else {
        // No pending save, safe to update
        setNotes(initialNotes)
    }
}, [initialNotes, notes, saveTimeoutId])
```

## How It Works Now

1. **User makes a manual edit:**
   - Editor saves the edit after 2-second delay
   - Local state is updated immediately

2. **New transcription arrives:**
   - Backend appends it to existing notes (doesn't regenerate)
   - Frontend receives the update
   - If user is typing and new content is just an append, it's accepted
   - If user made edits that conflict, user's edits take priority

3. **AI analysis completes:**
   - Backend updates only the Summary section
   - Preserves all other content including manual edits and transcripts

## Benefits

✅ Manual edits are preserved  
✅ Transcriptions continue to be added in real-time  
✅ AI summaries update without overwriting content  
✅ Smart merge strategy prevents conflicts  
✅ User doesn't lose work

## Files Modified

1. `/Users/xbxp122/dev/tinker/jarvis/src/features/listen/listenService.js`
   - Modified `updateSessionNotes()` to append transcriptions
   - Added `updateSummaryInNotes()` for summary updates
   - Updated callbacks to use new methods

2. `/Users/xbxp122/dev/tinker/jarvis/jarvis_web/components/NoteEditor.tsx`
   - Improved sync logic with intelligent merging
   - Allows append operations during user edits
