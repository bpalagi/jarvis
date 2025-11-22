# Jarvis

## Quick Start

### First Time Setup

```bash
# Use Node.js version 22
nvm use 22

# Install dependencies and build
npm i
npm run setup
```

### Running the App

After setup, start the application:

```bash
npm start
```

The app will run on:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Development

To rebuild the web frontend after making changes:

```bash
cd jarvis_web
npm run build
cd ..
npm start
```

## Features

### 🎤 Listen Mode with Live Note-Taking
Jarvis can listen to your conversations and automatically generate markdown notes in real-time. 

- **Live Updates**: The web Activity page shows your active Listen session with auto-updating notes
- **AI-Generated Content**: Notes include summaries, key points, action items, and full transcripts
- **Manual Editing**: Edit notes during or after a session with a built-in markdown editor
- **Persistent Storage**: All notes are saved in the local database


### Keyboard Shortcuts

`Cmd + \` : show and hide main window

`Cmd + L` : **Listen** to your microphone and system audio to gather context.

`Cmd + Enter` : **Ask** a specific question using your screen and conversation history as context.

`Cmd + '` : **Guide** me on what to say or do next based on the current context.

`Cmd + Arrows` : move main window position


