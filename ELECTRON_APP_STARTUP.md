# Electron App Startup Trace

This document outlines the startup process of the Jarvis Electron application, initiated by `npm run dev`.

## 1. `npm run dev` Command Execution

The `npm run dev` script, as defined in `package.json`, executes two commands concurrently:

*   `npm run watch:renderer`: This command runs `node build.js --watch`.
*   `electron .`: This command starts the Electron main process, using `src/index.js` as its entry point (specified by the `"main": "src/index.js"` field in `package.json`).

## 2. Renderer Process Build (`build.js`)

The `build.js` script is responsible for bundling the renderer process's JavaScript code using `esbuild`.

*   **Entry Points**: It processes `src/ui/app/HeaderController.js` and `src/ui/app/JarvisApp.js`.
*   **Output**: The bundled JavaScript files are output to `public/build/header.js` and `public/build/content.js` respectively.
*   **Watch Mode**: When run with `--watch` (as part of `npm run dev`), `esbuild` continuously monitors these source files for changes and automatically rebuilds the bundles.

## 3. Main Process Initialization (`src/index.js`)

`src/index.js` is the heart of the Electron main process.

1.  **Environment Variables**: Loads environment variables using `dotenv`.
2.  **Single Instance Lock**: Ensures only one instance of the application can run at a time. If a second instance is launched, it focuses the existing one.
3.  **Custom Protocol Handling**: Registers `jarvis://` as a custom URL protocol, enabling deep linking functionality.
4.  **`app.whenReady()` Block**: This is the primary asynchronous startup sequence:
    *   **Audio Capture Setup**: Configures native loopback audio capture, particularly for Windows.
    *   **Core Service Initialization**:
        *   `databaseInitializer.initialize()`: Sets up the application's SQLite database.
        *   `modelStateService.initialize()`: Initializes a service responsible for managing application state, including API keys and model configurations.
        *   `featureBridge.initialize()` and `windowBridge.initialize()`: Set up Inter-Process Communication (IPC) channels for communication between the main and renderer processes.
    *   **API Key IPC Handlers**:
        *   `ipcMain.handle('model:save-api-key', ...)`: An IPC handler that allows the renderer process to send an API key to the main process for storage via `modelStateService.setApiKey('gemini', key, 'llm')`.
        *   `ipcMain.handle('model:get-provider-config', ...)`: An IPC handler that allows the renderer process to request the stored API key from the main process via `modelStateService.getApiKey('gemini', 'llm')`.
    *   **Window Creation**: `createWindows()` is called to instantiate and display the Electron browser windows that host the user interface. These windows likely load HTML files (e.g., `src/ui/app/header.html`, `src/ui/app/content.html`) which then reference the JavaScript bundles created by `build.js`.
    *   **Deep Link Processing**: Any `jarvis://` URLs received before the app was ready are processed.
5.  **Graceful Shutdown**: An `app.on('before-quit', ...)` listener ensures that services (like audio capture) are stopped and database connections are properly closed before the application exits.

## 4. Renderer Process Loading (UI)

The `createWindows()` function (from `src/window/windowManager.js`, imported in `src/index.js`) is responsible for creating the `BrowserWindow` instances. These windows then load the HTML files (e.g., `src/ui/app/content.html`, `src/ui/app/header.html`) which, in turn, load the bundled JavaScript files (`public/build/content.js`, `public/build/header.js`) to render the user interface.

## How to Resolve Issues Regarding the Initial Need to Input an API Key

The application requires an API key, specifically for the 'gemini' LLM, which is managed by the `modelStateService`.

**Problem**: The application starts and immediately presents a screen asking for an API key.

**Resolution Steps**:

1.  **Understand the Flow**:
    *   The renderer process (UI) checks if an API key is already stored.
    *   If no key is found, the UI displays an input screen (as indicated by the "privacy policy link on the initial API key screen" memory).
    *   When the user enters a key and submits it, the renderer process uses the `ipcRenderer.invoke('model:save-api-key', { key: 'YOUR_API_KEY' })` IPC channel to send the key to the main process.
    *   The main process's `ipcMain.handle('model:save-api-key', ...)` listener receives the key and stores it using `modelStateService.setApiKey('gemini', key, 'llm')`.

2.  **Input the API Key**:
    *   Simply enter your Gemini API key into the provided input field on the initial screen.
    *   Ensure the key is correct and complete.

3.  **Troubleshooting (If the screen persists or an error occurs)**:
    *   **Check Console Logs**: Open the Electron app's developer tools (usually `Ctrl+Shift+I` or `Cmd+Option+I`) and check both the "Console" tab for the main process and the renderer process. Look for errors related to `modelStateService`, `ipcMain`, `ipcRenderer`, or API key storage.
    *   **Verify `modelStateService`**: The `modelStateService` is responsible for persistence. If there are issues saving the key, it might be related to the underlying storage mechanism (likely `electron-store` or SQLite, given the `databaseInitializer`).
    *   **Environment Variables (Less likely for initial input, but good to know)**: While the UI handles direct input, sometimes API keys can be set via environment variables. Check if there's any `.env` file or system environment variable named `GEMINI_API_KEY` or similar that might be interfering or expected. However, the current flow explicitly uses `modelStateService` for saving.
    *   **Database Inspection**: If the issue persists, and you suspect database problems, you might need to inspect the SQLite database directly (if accessible) to see if the key is being stored correctly. The `databaseInitializer` and `sqlite.repository.js` files are relevant here.

By following these steps, you should be able to successfully input and store your API key, allowing the application to proceed past the initial setup screen.
