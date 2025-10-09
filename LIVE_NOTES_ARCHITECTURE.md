# Live Note-Taking Feature Architecture

## Overview

The live note-taking feature enables real-time markdown note generation and editing during Listen sessions, displayed in the web-based Activity page.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Desktop App (Electron)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Listen Window│         │ Header Window│                      │
│  │              │         │              │                      │
│  │  STT Service │         │ Start/Stop   │                      │
│  │              │         │  Controls    │                      │
│  └──────┬───────┘         └──────────────┘                      │
│         │                                                        │
│         │ transcriptions                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────┐                  │
│  │        ListenService                      │                  │
│  │  • handleTranscriptionComplete()         │                  │
│  │  • updateSessionNotes()                  │                  │
│  │  • generateMarkdownNotes()               │                  │
│  └──────┬───────────────────────┬───────────┘                  │
│         │                       │                               │
│         │ save transcript       │ save notes                   │
│         ▼                       ▼                               │
│  ┌──────────────┐        ┌──────────────┐                      │
│  │   STT Repo   │        │ Session Repo │                      │
│  │              │        │              │                      │
│  │ transcripts  │        │  sessions    │                      │
│  │   table      │        │   table      │                      │
│  └──────────────┘        └──────────────┘                      │
│         │                       │                               │
│         └───────────┬───────────┘                               │
│                     ▼                                           │
│              ┌─────────────┐                                    │
│              │   SQLite    │                                    │
│              │  Database   │                                    │
│              │             │                                    │
│              │  jarvis.db  │                                    │
│              └──────┬──────┘                                    │
│                     │                                           │
│                     │ IPC Bridge                                │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │ eventBridge.emit('web-data-request')
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend API Server (Express)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routes:                                                         │
│  • GET    /api/conversations           → getAllByUserId()      │
│  • GET    /api/conversations/active    → getActiveSession()    │
│  • GET    /api/conversations/:id       → getById()             │
│  • PATCH  /api/conversations/:id/notes → updateNotes()         │
│  • DELETE /api/conversations/:id       → deleteWithRelatedData()│
│                                                                   │
│  Port: Dynamic (shown in logs, e.g., 9001)                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP/JSON
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│               Web Frontend (Next.js/React)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────┐         │
│  │           Activity Page (/activity)                │         │
│  │                                                     │         │
│  │  ┌─────────────────────────────────────────────┐ │         │
│  │  │  Live Session Section (if active)            │ │         │
│  │  │  • Auto-refresh every 5 seconds             │ │         │
│  │  │  • Markdown preview                         │ │         │
│  │  │  • Edit button → Textarea editor            │ │         │
│  │  │  • Save button → PATCH /notes               │ │         │
│  │  └─────────────────────────────────────────────┘ │         │
│  │                                                     │         │
│  │  ┌─────────────────────────────────────────────┐ │         │
│  │  │  Past Activity List                          │ │         │
│  │  │  • Filtered to exclude active session       │ │         │
│  │  │  • Click → Details page                     │ │         │
│  │  └─────────────────────────────────────────────┘ │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌───────────────────────────────────────────────────┐         │
│  │      Details Page (/activity/details)             │         │
│  │                                                     │         │
│  │  • Summary (from summaries table)                │         │
│  │  • Notes (from sessions.notes)                   │         │
│  │  • Transcripts (from transcripts table)          │         │
│  │  • AI Messages (from ai_messages table)          │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                   │
│  Port: Dynamic (shown in logs, e.g., 3000)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Session Start Flow
```
User clicks "Listen"
    ↓
ListenService.initializeSession()
    ↓
sessionRepository.getOrCreateActive('listen')
    ↓
SQLite: INSERT/UPDATE sessions table
    ↓
Returns session ID
```

### 2. Transcription Flow
```
Audio captured → STT Service
    ↓
SttService.onTranscriptionComplete(speaker, text)
    ↓
ListenService.handleTranscriptionComplete()
    ↓
├─→ sttRepository.addTranscript()
│       ↓
│   SQLite: INSERT into transcripts
│
└─→ summaryService.addConversationTurn()
        ↓
    (triggers analysis after 3 turns)
        ↓
    summaryRepository.saveSummary()
        ↓
    SQLite: INSERT/UPDATE summaries
        ↓
    ListenService.updateSessionNotes()
        ↓
    generateMarkdownNotes(transcripts, summary)
        ↓
    sessionRepository.updateNotes(id, markdown)
        ↓
    SQLite: UPDATE sessions SET notes = ?
```

### 3. Web View Flow
```
Browser loads /activity page
    ↓
React: useEffect(() => {
    fetchSessions()      → GET /api/conversations
    fetchActiveSession() → GET /api/conversations/active
    setInterval(5s)      → Poll for updates
})
    ↓
Backend API → IPC Bridge → Session Repository
    ↓
SQLite: SELECT * FROM sessions WHERE ended_at IS NULL
    ↓
Return session with notes
    ↓
React: renderMarkdown(session.notes)
```

### 4. Note Edit Flow
```
User clicks "Edit Notes"
    ↓
React: setIsEditingNotes(true)
    ↓
User edits in textarea
    ↓
User clicks "Save Notes"
    ↓
PATCH /api/conversations/:id/notes
    body: { notes: "markdown content" }
    ↓
Backend API → IPC Bridge
    ↓
sessionRepository.updateNotes(id, notes)
    ↓
SQLite: UPDATE sessions SET notes = ?, updated_at = ?
    ↓
React: Update local state & hide editor
```

## Database Schema Changes

### sessions Table (Modified)
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT,
    session_type TEXT DEFAULT 'ask',
    started_at INTEGER,
    ended_at INTEGER,
    notes TEXT,              -- NEW COLUMN
    sync_state TEXT DEFAULT 'clean',
    updated_at INTEGER
);
```

## Key Components

### Backend (Electron Main Process)

1. **ListenService** (`src/features/listen/listenService.js`)
   - Orchestrates STT, Summary, and Note generation
   - Methods:
     - `updateSessionNotes()` - Regenerates markdown from current data
     - `generateMarkdownNotes(transcripts, summary)` - Formats markdown

2. **Session Repository** (`src/features/common/repositories/session/`)
   - Handles all session database operations
   - New methods:
     - `updateNotes(id, notes)` - Updates session notes
     - `getActiveSession()` - Gets active session for current user

3. **IPC Handlers** (`src/index.js`)
   - Bridges web requests to Electron services
   - Handlers:
     - `get-active-session` - Returns active session
     - `update-session-notes` - Updates session notes

### Frontend (Next.js)

1. **Activity Page** (`jarvis_web/app/activity/page.tsx`)
   - Main note-taking interface
   - Features:
     - Live session display with auto-refresh
     - Markdown preview with custom renderer
     - Inline editor with save/cancel
     - Filtered past activity list

2. **API Client** (`jarvis_web/utils/api.ts`)
   - HTTP client for backend communication
   - Functions:
     - `getActiveSession()` - Fetches active session
     - `updateSessionNotes(id, notes)` - Updates notes
     - `getSessions()` - Fetches all sessions

## Markdown Format

The auto-generated notes follow this structure:

```markdown
# Live Notes

## Summary

> [TL;DR from AI]

### Key Points

- Point 1
- Point 2
- Point 3

### Action Items

- [ ] Action 1
- [ ] Action 2

## Transcript

**Speaker1:** What they said

**Speaker2:** Their response
```

## Performance Considerations

1. **Polling Interval**: 5 seconds (configurable)
   - Balance between real-time updates and API load
   - Consider WebSocket upgrade for true real-time

2. **Database Updates**: On every transcript
   - Notes regenerated after each transcription
   - Summary updates trigger note regeneration
   - Uses SQLite transactions for consistency

3. **Markdown Rendering**: Client-side
   - Basic regex-based renderer
   - Can be upgraded to full markdown parser
   - No XSS risk (user's own content)

## Security

1. **Authentication**: 
   - Uses X-User-ID header (from default user)
   - Session-based in production deployment

2. **Data Validation**:
   - Notes content is sanitized on save
   - No script injection possible
   - User can only edit their own sessions

3. **IPC Security**:
   - Bridge validates all requests
   - No direct database access from web
   - All operations through validated repositories

## Future Enhancements

1. **Real-time Updates**: WebSocket instead of polling
2. **Rich Editor**: Monaco or CodeMirror for better UX
3. **Export**: Download notes as .md file
4. **Templates**: Customizable note structure
5. **Attachments**: Images, links, embedded media
6. **Search**: Full-text search across notes
7. **Versioning**: Track note edit history
