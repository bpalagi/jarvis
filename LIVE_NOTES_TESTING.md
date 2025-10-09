# Live Note-Taking Feature - Testing Guide

## Overview
The live note-taking feature converts the My Activity page into a dynamic interface that shows live updates during Listen sessions, stores content as markdown, and enables manual editing.

## What Was Implemented

### Backend Changes

1. **Database Schema** (`src/features/common/config/schema.js`)
   - Added `notes` TEXT column to the `sessions` table
   - This will be automatically migrated when the app starts

2. **Session Repository** (`src/features/common/repositories/session/`)
   - Added `updateNotes(id, notes)` - Updates notes for a session
   - Added `getActiveSession()` - Gets the current active session
   - Updated `getAllByUserId()` to include notes column

3. **Listen Service** (`src/features/listen/listenService.js`)
   - Added `updateSessionNotes()` - Generates and saves markdown notes
   - Added `generateMarkdownNotes(transcripts, summary)` - Creates formatted markdown from session data
   - Integrated with transcription and summary callbacks to auto-update notes

4. **Backend API** (`jarvis_web/backend_node/routes/conversations.js`)
   - Added `GET /api/conversations/active` - Get active session
   - Added `PATCH /api/conversations/:session_id/notes` - Update session notes

5. **IPC Handlers** (`src/index.js`)
   - Added `update-session-notes` handler
   - Added `get-active-session` handler

### Frontend Changes

1. **API Client** (`jarvis_web/utils/api.ts`)
   - Added `notes?: string` to Session interface
   - Added `getActiveSession()` function
   - Added `updateSessionNotes(sessionId, notes)` function

2. **Activity Page** (`jarvis_web/app/activity/page.tsx`)
   - Shows active Listen session at the top with live updates
   - Displays markdown notes with basic rendering
   - Provides inline markdown editor for manual editing
   - Polls for updates every 5 seconds
   - Filters active session from past activity list

3. **Details Page** (`jarvis_web/app/activity/details/page.tsx`)
   - Added Notes section to display saved markdown notes

## Testing Instructions

### Prerequisites
1. Build the desktop app: `npm run build:renderer && npm run build:web`
2. Start the desktop app: `npm start`

### Test 1: Live Note Generation During Listen Session

1. **Start a Listen Session:**
   - Open the desktop app
   - Click the "Listen" button in the header
   - The Listen window should appear

2. **Monitor Live Updates:**
   - Open a browser and navigate to `http://localhost:<port>/activity` (port shown in app logs)
   - You should see a "Live Session" section at the top with a pulsing blue dot
   - The section should say "No notes yet. Notes will appear here as the session progresses."

3. **Generate Transcripts:**
   - Speak or play audio near your microphone
   - Transcripts should appear in the Listen window
   - After ~3 conversation turns, the AI should generate a summary

4. **Verify Live Updates:**
   - Refresh the Activity page in your browser (or wait for auto-refresh)
   - You should now see markdown-formatted notes including:
     - Summary section with key points
     - Action items (if any)
     - Full transcript
   - The notes should update automatically as more transcripts are added

### Test 2: Manual Note Editing

1. **Edit Active Session Notes:**
   - While a Listen session is active, go to the Activity page
   - Click "Edit Notes" button in the Live Session section
   - A markdown editor (textarea) should appear with current notes
   - Modify the notes (add text, change formatting, etc.)
   - Click "Save Notes"
   - The preview should update with your changes

2. **Verify Persistence:**
   - Refresh the page
   - Your edited notes should still be there
   - The auto-generated content should still update when new transcripts arrive

### Test 3: End Session and Review

1. **Stop the Listen Session:**
   - Click "Stop" in the desktop app header
   - The session should end

2. **Check Past Activity:**
   - Go to the Activity page
   - The session should now appear in "Your Past Activity" section
   - It should no longer show in the "Live Session" section

3. **View Details:**
   - Click on the session in past activity
   - The details page should show:
     - Summary section (if available)
     - Notes section with the markdown content
     - Transcript section
   - Notes should be formatted and readable

### Test 4: Edge Cases

1. **Multiple Sessions:**
   - Start a new Listen session
   - Verify only the newest active session shows in Live Session
   - Previous sessions should be in Past Activity

2. **No Audio/Silent Session:**
   - Start a Listen session but don't speak
   - The Activity page should still show the Live Session
   - Notes should say "No notes yet..."

3. **Browser Refresh During Session:**
   - Start a Listen session and generate some transcripts
   - Refresh the Activity page
   - The live session should still appear with current notes

## Expected Markdown Format

The generated notes follow this structure:

```markdown
# Live Notes

## Summary

> [TL;DR summary from AI]

### Key Points

- First key point
- Second key point
- Third key point

### Action Items

- [ ] First action item
- [ ] Second action item

## Transcript

**Speaker1:** First thing said

**Speaker2:** Response to first thing

**Speaker1:** Another comment
```

## Troubleshooting

### Notes not updating
- Check console logs in the desktop app for errors
- Verify the session has an ID in the database
- Check that transcripts are being saved

### Activity page not showing live session
- Verify the session has `ended_at = NULL` in database
- Check browser console for API errors
- Verify the backend API is running on the correct port

### Markdown not rendering properly
- The current implementation uses basic rendering
- Complex markdown (tables, code blocks) may not render perfectly
- This can be enhanced with a proper markdown library later

## Database Verification

To check the database directly:

```sql
-- View active sessions
SELECT id, title, session_type, started_at, ended_at, 
       SUBSTR(notes, 1, 50) as notes_preview 
FROM sessions 
WHERE ended_at IS NULL;

-- View a specific session's notes
SELECT notes FROM sessions WHERE id = '<session-id>';
```

The database is located at:
- macOS: `~/Library/Application Support/Jarvis/jarvis.db`
- Windows: `%APPDATA%\Jarvis\jarvis.db`

## Future Enhancements

1. **Real-time WebSocket Updates:** Replace polling with WebSocket for instant updates
2. **Better Markdown Rendering:** Use a full markdown library like react-markdown
3. **Markdown Editor:** Replace textarea with a rich markdown editor (e.g., Monaco, CodeMirror)
4. **Export Notes:** Add ability to export notes as .md file
5. **Note Templates:** Allow users to customize the note format
6. **Collaborative Editing:** Support multiple users editing the same notes
