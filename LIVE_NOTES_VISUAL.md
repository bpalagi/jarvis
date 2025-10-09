# Live Note-Taking Feature - Visual Overview

## Before (Original Activity Page)

```
┌────────────────────────────────────────────────┐
│              Activity Page                     │
├────────────────────────────────────────────────┤
│                                                │
│  Good morning, User                            │
│                                                │
│  Your Past Activity                            │
│  ────────────────────                          │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Session 1 - Listen                       │ │
│  │ Started: 10:00 AM                        │ │
│  │ [Delete]                                 │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Session 2 - Ask                          │ │
│  │ Started: 9:30 AM                         │ │
│  │ [Delete]                                 │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  (All sessions shown in one list)              │
│                                                │
└────────────────────────────────────────────────┘
```

## After (With Live Note-Taking)

```
┌────────────────────────────────────────────────────────────────┐
│                    Activity Page                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Good morning, User                                            │
│                                                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│  ┃ 🔵 Live Session                [Edit Notes] [End Session]┃ │
│  ┃ Started: 2:30 PM                                          ┃ │
│  ┃ ────────────────────────────────────────────────────────  ┃ │
│  ┃                                                            ┃ │
│  ┃ # Live Notes                                              ┃ │
│  ┃                                                            ┃ │
│  ┃ ## Summary                                                ┃ │
│  ┃ > Discussion about project planning and next steps        ┃ │
│  ┃                                                            ┃ │
│  ┃ ### Key Points                                            ┃ │
│  ┃ • Project deadline is next Friday                         ┃ │
│  ┃ • Need to finalize design mockups                         ┃ │
│  ┃ • Team meeting scheduled for tomorrow                     ┃ │
│  ┃                                                            ┃ │
│  ┃ ### Action Items                                          ┃ │
│  ┃ ☐ Review design proposals                                 ┃ │
│  ┃ ☐ Update project timeline                                 ┃ │
│  ┃                                                            ┃ │
│  ┃ ## Transcript                                             ┃ │
│  ┃ **User:** We need to discuss the project timeline         ┃ │
│  ┃ **Assistant:** Let me help you organize your thoughts... ┃ │
│  ┃                                                            ┃ │
│  ┃ (Updates automatically every 5 seconds)                   ┃ │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                                │
│  Your Past Activity                                            │
│  ────────────────────                                          │
│                                                                │
│  ┌──────────────────────────────────────────┐                 │
│  │ Session 1 - Listen                       │                 │
│  │ Started: 10:00 AM                        │                 │
│  │ [Delete]                                 │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                │
│  ┌──────────────────────────────────────────┐                 │
│  │ Session 2 - Ask                          │                 │
│  │ Started: 9:30 AM                         │                 │
│  │ [Delete]                                 │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                │
│  (Active session filtered out from past list)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Edit Mode

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔵 Live Session                                           ┃
┃ Started: 2:30 PM                                          ┃
┃ ────────────────────────────────────────────────────────  ┃
┃                                                            ┃
┃ ┌────────────────────────────────────────────────────┐   ┃
┃ │ # Live Notes                                       │   ┃
┃ │                                                    │   ┃
┃ │ ## Summary                                         │   ┃
┃ │ > Discussion about project planning               │   ┃
┃ │                                                    │   ┃
┃ │ ### Key Points                                     │   ┃
┃ │ - Project deadline is next Friday                 │   ┃
┃ │ - Need to finalize design mockups                 │   ┃
┃ │                                                    │   ┃
┃ │ ### My Additions                                   │   ┃
┃ │ - Remember to check with Sarah about budget▊      │   ┃
┃ │                                                    │   ┃
┃ │ (Editable markdown textarea)                       │   ┃
┃ └────────────────────────────────────────────────────┘   ┃
┃                                                            ┃
┃ [Save Notes]  [Cancel]                                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Details Page (After Clicking Session)

```
┌────────────────────────────────────────────────────────────┐
│  ← Back                                                     │
│                                                             │
│  Session 1 - Listen                        [Delete Activity]│
│  January 15, 2025 • 10:00 AM                               │
│  ──────────────────────────────────────────────────────────│
│                                                             │
│  Summary                                                    │
│  ─────────                                                  │
│  "Quick discussion about upcoming project milestones"       │
│                                                             │
│  Key Points:                                                │
│  • Deadline next Friday                                     │
│  • Design review needed                                     │
│                                                             │
│  Action Items:                                              │
│  • Complete design mockups                                  │
│  • Schedule team meeting                                    │
│                                                             │
│  Notes                                    ← NEW!            │
│  ─────                                                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ # Live Notes                                         │ │
│  │                                                      │ │
│  │ ## Summary                                           │ │
│  │ > Quick discussion about project milestones          │ │
│  │                                                      │ │
│  │ ### Key Points                                       │ │
│  │ • Deadline next Friday                               │ │
│  │ • Design review needed                               │ │
│  │                                                      │ │
│  │ ### My Notes                                         │ │
│  │ Remember to follow up with stakeholders             │ │
│  │                                                      │ │
│  │ (Formatted markdown display)                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Listen: Transcript                                         │
│  ────────────────                                           │
│  User: Let's discuss the project timeline                   │
│  Assistant: I can help you organize that...                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Data Flow Animation

```
Step 1: User starts Listen session
┌──────────┐
│ Desktop  │ Cmd+L
│   App    │ ────────→ [Start Listen]
└──────────┘

Step 2: Audio captured and transcribed
┌──────────┐
│   STT    │ "Let's discuss..."
│ Service  │ ─────────────────────→ [Save Transcript]
└──────────┘

Step 3: Notes generated automatically
┌──────────┐
│  Listen  │ Generate Markdown
│ Service  │ ──────────────────→ [Update Session Notes]
└──────────┘                           ↓
                                       │
                              ┌────────▼─────┐
                              │   Database   │
                              │              │
                              │ sessions     │
                              │ .notes       │
                              └────────▲─────┘
                                       │
Step 4: Web page polls for updates         │
┌──────────┐                           │
│   Web    │ GET /active               │
│  Client  │ ──────────────────────────┘
└──────────┘         (every 5 seconds)

Step 5: User sees live updates
┌──────────┐
│ Browser  │ 🔵 Live Session
│  Screen  │ [Notes updating...]
└──────────┘
```

## Feature Comparison

### Before
- ❌ No live session visibility
- ❌ No automatic note generation
- ❌ No markdown support
- ❌ No editing capabilities
- ✅ View past activity
- ✅ View transcripts

### After
- ✅ Live session indicator
- ✅ Automatic markdown notes
- ✅ Real-time updates (5s polling)
- ✅ Manual note editing
- ✅ Formatted markdown display
- ✅ Notes in details page
- ✅ Action items with checkboxes
- ✅ View past activity
- ✅ View transcripts

## Technical Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Process                      │
│                                                          │
│  Listen Session                                          │
│       ↓                                                  │
│  Transcription                                           │
│       ↓                                                  │
│  Generate Markdown ────────────────┐                    │
│       ↓                             ↓                    │
│  Save to Database          Send to Summary Service      │
│       ↓                             ↓                    │
│  sessions.notes             Update Analysis             │
│                                     ↓                    │
│                          Re-generate Notes               │
│                                     ↓                    │
│                          Update Database                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ IPC Bridge
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   Express API                            │
│                                                          │
│  GET /active ───────────────→ Return active session     │
│  PATCH /:id/notes ──────────→ Update notes              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP/JSON
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   React Frontend                         │
│                                                          │
│  Poll every 5s ──────────→ GET /active                  │
│       ↓                                                  │
│  Display live notes                                      │
│       ↓                                                  │
│  Allow editing ──────────→ PATCH /:id/notes             │
│       ↓                                                  │
│  Show in past activity                                   │
└──────────────────────────────────────────────────────────┘
```

## Database Changes

### sessions Table

```sql
-- Before
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT,
    session_type TEXT DEFAULT 'ask',
    started_at INTEGER,
    ended_at INTEGER,
    -- notes TEXT,  ← NOT HERE YET
    sync_state TEXT DEFAULT 'clean',
    updated_at INTEGER
);

-- After
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT,
    session_type TEXT DEFAULT 'ask',
    started_at INTEGER,
    ended_at INTEGER,
    notes TEXT,              ← NEW COLUMN!
    sync_state TEXT DEFAULT 'clean',
    updated_at INTEGER
);
```

### Example Data

```json
{
  "id": "abc-123",
  "uid": "default_user",
  "title": "Conversation - Jan 15",
  "session_type": "listen",
  "started_at": 1705334400,
  "ended_at": null,
  "notes": "# Live Notes\n\n## Summary\n> Project discussion\n\n### Key Points\n- Deadline next Friday\n- Need design review",
  "updated_at": 1705334567
}
```

## User Journey

```
1. User starts Listen session in desktop app
   ↓
2. Opens browser → /activity page
   ↓
3. Sees "Live Session" at top with blue indicator
   ↓
4. Notes appear: "No notes yet..."
   ↓
5. User speaks, audio is captured
   ↓
6. After 5 seconds, page refreshes
   ↓
7. Transcript appears in notes
   ↓
8. After 3 conversation turns
   ↓
9. AI generates summary
   ↓
10. Summary appears in notes
    ↓
11. User clicks "Edit Notes"
    ↓
12. Adds personal comments
    ↓
13. Clicks "Save Notes"
    ↓
14. Notes update and editor closes
    ↓
15. User stops Listen session
    ↓
16. Session moves to "Past Activity"
    ↓
17. User can click to view full details
    ↓
18. Notes visible in details page
```

## File Changes Summary

```
Backend Changes (Electron/Node.js):
├── schema.js                    +1 line   (add notes column)
├── sqlite.repository.js         +18 lines (add methods)
├── session/index.js             +7 lines  (export methods)
├── listenService.js             +86 lines (generate notes)
├── conversations.js (routes)     +27 lines (new endpoints)
└── index.js                     +6 lines  (IPC handlers)

Frontend Changes (React/Next.js):
├── api.ts                       +15 lines (new functions)
├── activity/page.tsx            +248 lines (redesigned UI)
└── activity/details/page.tsx    +10 lines (show notes)

Documentation:
├── README.md                    +13 lines (feature desc)
├── LIVE_NOTES_ARCHITECTURE.md   +314 lines (tech docs)
├── LIVE_NOTES_TESTING.md        +205 lines (test guide)
└── LIVE_NOTES_QUICKSTART.md     +228 lines (user guide)

Total: 945 lines added, 5 lines modified
```
