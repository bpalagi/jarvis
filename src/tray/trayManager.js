const { Tray, Menu, shell, app, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
    constructor() {
        this.tray = null;
        this.isListening = false;
        this.webUrl = process.env.jarvis_WEB_URL || 'http://localhost:3000';
    }

    initialize(eventBridge) {
        this.eventBridge = eventBridge;

        // Create tray icon
        // Use a simple icon or generate one if missing. 
        // For now, we'll try to use the app icon or a default system icon.
        let iconPath = path.join(__dirname, '../../assets/icon.png');

        // If we don't have a specific icon, we can use a simple colored square or similar for dev
        // But for now let's assume the build process handles icons or we use a fallback
        try {
            this.tray = new Tray(iconPath);
        } catch (e) {
            console.warn('[Tray] Icon not found, using empty image as fallback');
            // Create an empty 16x16 image
            const emptyImage = nativeImage.createEmpty();
            this.tray = new Tray(emptyImage);
            this.tray.setTitle('Jarvis'); // Set a title so it's visible
        }

        if (!this.tray) {
            console.error('[Tray] Failed to create tray icon even with fallback');
            return;
        }

        this.tray.setToolTip('Jarvis AI');
        this.updateContextMenu();

        // Listen for status updates
        if (this.eventBridge) {
            this.eventBridge.on('listen-status-changed', (isListening) => {
                this.isListening = isListening;
                this.updateContextMenu();
            });
        }

        // Handle click
        this.tray.on('click', () => {
            this.openDashboard();
        });
    }

    updateContextMenu() {
        if (!this.tray) return;

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open Dashboard',
                click: () => this.openDashboard()
            },
            { type: 'separator' },
            {
                label: this.isListening ? 'Stop Listening' : 'Start Listening',
                click: () => this.toggleListening()
            },
            { type: 'separator' },
            {
                label: 'Quit Jarvis',
                click: () => {
                    app.quit();
                }
            }
        ]);

        this.tray.setContextMenu(contextMenu);
    }

    openDashboard() {
        shell.openExternal(this.webUrl);
    }

    toggleListening() {
        if (this.eventBridge) {
            this.eventBridge.emit('toggle-listen-request');
        }
    }

    destroy() {
        if (this.tray) {
            this.tray.destroy();
        }
    }
}

module.exports = new TrayManager();
