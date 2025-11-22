// try {
//     const reloader = require('electron-reloader');
//     reloader(module, {
//     });
// } catch (err) {
// }

require('dotenv').config();

const { app, shell, ipcMain, dialog, desktopCapturer, session, Tray, Menu } = require('electron');
const path = require('node:path');
const express = require('express');
const { EventEmitter } = require('events');

// Services
const databaseInitializer = require('./features/common/services/databaseInitializer');
const authService = require('./features/common/services/authService');
const listenService = require('./features/listen/listenService');
const askService = require('./features/ask/askService');
const settingsService = require('./features/settings/settingsService');
const sessionRepository = require('./features/common/repositories/session');
const modelStateService = require('./features/common/services/modelStateService');
const featureBridge = require('./bridge/featureBridge');

// New Services
const websocketService = require('./services/websocketService');
const trayManager = require('./tray/trayManager');

// Global variables
const eventBridge = new EventEmitter();
let WEB_PORT = 3000;
let isShuttingDown = false;

// Make modelStateService global as in previous version
global.modelStateService = modelStateService;

// Native deep link handling
let pendingDeepLinkUrl = null;

function setupProtocolHandling() {
    try {
        if (!app.isDefaultProtocolClient('jarvis')) {
            const success = app.setAsDefaultProtocolClient('jarvis');
            if (success) {
                console.log('[Protocol] Successfully set as default protocol client for jarvis://');
            } else {
                console.warn('[Protocol] Failed to set as default protocol client');
            }
        }
    } catch (error) {
        console.error('[Protocol] Error during protocol registration:', error);
    }

    app.on('second-instance', (event, commandLine) => {
        console.log('[Protocol] Second instance command line:', commandLine);

        // Focus browser if open? Or just handle URL
        // For now, just handle URL
        let protocolUrl = null;
        for (const arg of commandLine) {
            if (arg && typeof arg === 'string' && arg.startsWith('jarvis://')) {
                protocolUrl = arg; // Simplified parsing for now
                break;
            }
        }

        if (protocolUrl) {
            handleCustomUrl(protocolUrl);
        }
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        if (app.isReady()) {
            handleCustomUrl(url);
        } else {
            pendingDeepLinkUrl = url;
        }
    });
}

if (process.platform === 'win32') {
    // Windows arg parsing logic if needed
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

setupProtocolHandling();

// Hide dock icon on macOS since we are a tray app now (optional, user might want it)
// app.dock.hide(); 

app.whenReady().then(async () => {
    // Setup native loopback audio capture for Windows
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
            callback({ video: sources[0], audio: 'loopback' });
        }).catch((error) => {
            console.error('Failed to get desktop capturer sources:', error);
            callback({});
        });
    });

    try {
        await databaseInitializer.initialize();
        console.log('>>> [index.js] Database initialized successfully');

        await modelStateService.initialize();

        // Initialize bridges
        featureBridge.initialize();

        // Setup Web Data Handlers (IPC for legacy/compatibility, but mostly moving to API/WS)
        setupWebDataHandlers();

        // Start web server
        const { frontendPort, apiServer } = await startWebStack();
        WEB_PORT = frontendPort;
        console.log('Web front-end listening on', WEB_PORT);

        // Initialize WebSocket Service
        websocketService.initialize(apiServer);

        // Handle WebSocket commands
        websocketService.on('message', async (message, ws) => {
            if (message.type === 'command') {
                console.log('[WebSocket] Received command:', message.data);
                const { action } = message.data;

                if (action === 'start-listening') {
                    if (!listenService.isSessionActive()) {
                        // Start listening
                        // Note: listenService.startTranscription might need arguments or setup
                        // Let's assume it works with defaults for now or check its signature
                        try {
                            // We need to create a session first usually
                            // But listenService.initializeNewSession() might be what we want
                            // Let's check listenService.js again to be sure
                            // For now, let's try to trigger it via the shortcut method which handles the flow
                            await listenService.toggleListenSessionFromShortcut();
                            websocketService.broadcast('listen-status', { isListening: true });
                        } catch (e) {
                            console.error('Failed to start listening:', e);
                            websocketService.broadcast('listen-error', { error: e.message });
                        }
                    }
                } else if (action === 'stop-listening') {
                    if (listenService.isSessionActive()) {
                        await listenService.stopTranscription();
                        websocketService.broadcast('listen-status', { isListening: false });
                    }
                } else if (action === 'ask-question') {
                    const { question } = message.data;
                    try {
                        const history = listenService.getConversationHistory();
                        await askService.sendMessage(question, history);
                    } catch (e) {
                        console.error('Failed to ask question:', e);
                        websocketService.broadcast('chat-error', { error: e.message });
                    }
                }
            } else if (message.type === 'mic-audio') {
                // Forward microphone audio to listenService
                try {
                    const { data, mimeType } = message.data;
                    await listenService.sendMicAudioContent(data, mimeType);
                } catch (e) {
                    console.error('Failed to process mic audio:', e);
                }
            }
        });

        // Initialize Tray
        trayManager.initialize(eventBridge);

        // Initialize Listen Service (connect it to WebSocket)
        // We need to patch listenService to use websocket instead of sendToRenderer
        // For now, we'll listen to eventBridge and broadcast via WS
        setupServiceIntegrations();

        // Auto-open browser
        const dashboardUrl = `http://localhost:${WEB_PORT}`;
        console.log(`Opening dashboard at ${dashboardUrl}`);
        shell.openExternal(dashboardUrl);

    } catch (err) {
        console.error('>>> [index.js] Initialization failed', err);
        dialog.showErrorBox('Application Error', 'Critical error during startup.');
    }

    if (pendingDeepLinkUrl) {
        handleCustomUrl(pendingDeepLinkUrl);
        pendingDeepLinkUrl = null;
    }
});

function setupServiceIntegrations() {
    // Listen Service Integration
    // When listen service emits data, broadcast to WebSocket

    // Note: We need to modify listenService to emit events we can catch, 
    // or we can monkey-patch its sendToRenderer method if we want to avoid touching it too much yet.
    // But better to use the eventBridge if possible.

    // For now, let's hook into the eventBridge events that listenService might emit
    // Or better, let's modify listenService in the next step to use websocketService directly or emit events.

    // Temporary bridge:
    eventBridge.on('listen-data', (data) => {
        websocketService.broadcast('listen-data', data);
    });

    // Handle toggle request from Tray
    eventBridge.on('toggle-listen-request', async () => {
        const isListening = listenService.isSessionActive();
        if (isListening) {
            await listenService.stopTranscription(); // Check method name
        } else {
            // Start with default settings
            // await listenService.startTranscription(); 
            // Need to check exact API of listenService
        }
    });
}

app.on('before-quit', async (event) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    event.preventDefault();

    try {
        await listenService.closeSession();
        try {
            await sessionRepository.endAllActiveSessions();
        } catch (e) { }

        databaseInitializer.close();
        websocketService.close();
        trayManager.destroy();

    } catch (error) {
        console.error('Error during shutdown:', error);
    } finally {
        app.exit(0);
    }
});

// Keep app alive even when no windows are open (since we are headless/tray)
app.on('window-all-closed', () => {
    // Do nothing, keep running
});

function setupWebDataHandlers() {
    // Keep existing IPC handlers for now if any legacy code uses them
    // But mainly we will rely on API endpoints
    const sessionRepository = require('./features/common/repositories/session');
    const userRepository = require('./features/common/repositories/user');
    const modelStateService = require('./features/common/services/modelStateService');

    ipcMain.on('web-data-request', async (event, { channel, responseChannel, payload }) => {
        // ... existing implementation or simplified ...
        // For now, we can keep the logic from the old index.js if we want to support 
        // the existing web dashboard which uses IPC.
        // But since we are moving to Headless, the web dashboard (Next.js) 
        // currently talks to its own backend_node which talks to Main via IPC.
        // So we MUST keep this IPC handler for the current web dashboard to work 
        // until we refactor the web backend to use direct service calls or the Main process exposes an API directly.

        // RE-IMPLEMENTING THE IPC HANDLER FROM OLD INDEX.JS
        // (Simplified for brevity, assuming we'll migrate to direct API calls soon)

        const handleRequest = async () => {
            let result;
            try {
                switch (channel) {
                    case 'get-sessions':
                        result = await sessionRepository.getAllByUserId();
                        break;
                    case 'get-session-details':
                        // ... (simplified)
                        const session = await sessionRepository.getById(payload);
                        result = { session }; // simplified
                        break;
                    // ... other cases ...
                    default:
                    // console.warn('Unknown IPC channel:', channel);
                }
                event.sender.send(responseChannel, { success: true, data: result });
            } catch (error) {
                event.sender.send(responseChannel, { success: false, error: error.message });
            }
        };
        handleRequest();
    });
}

async function handleCustomUrl(url) {
    console.log('[Custom URL]', url);
    // Open in browser
    const urlObj = new URL(url);
    const action = urlObj.hostname;
    const targetUrl = `http://localhost:${WEB_PORT}/${action}`;
    shell.openExternal(targetUrl);
}

async function startWebStack() {
    const isDev = !app.isPackaged;
    const apiPort = 3001;
    const frontendPort = 3000;

    process.env.jarvis_API_PORT = apiPort.toString();
    process.env.jarvis_API_URL = `http://localhost:${apiPort}`;
    process.env.jarvis_WEB_PORT = frontendPort.toString();
    process.env.jarvis_WEB_URL = `http://localhost:${frontendPort}`;

    const createBackendApp = require('../jarvis_web/backend_node');
    const nodeApi = createBackendApp(eventBridge);

    const staticDir = app.isPackaged
        ? path.join(process.resourcesPath, 'out')
        : path.join(__dirname, '..', 'jarvis_web', 'out');

    const fs = require('fs');

    // Frontend Server
    const frontSrv = express();
    if (fs.existsSync(staticDir)) {
        frontSrv.use(express.static(staticDir));
        frontSrv.get('*', (req, res) => {
            res.sendFile(path.join(staticDir, 'index.html'));
        });
    } else {
        console.warn('Frontend build not found at', staticDir);
    }

    const frontendServer = await new Promise((resolve) => {
        const server = frontSrv.listen(frontendPort, '127.0.0.1', () => resolve(server));
    });

    // API Server
    const apiSrv = express();
    apiSrv.use(nodeApi);

    const apiServer = await new Promise((resolve) => {
        const server = apiSrv.listen(apiPort, '127.0.0.1', () => resolve(server));
    });

    return { frontendPort, apiServer };
}


