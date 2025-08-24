# Jarvis: Design Patterns and Architectural Overview

---

## Core Architectural Principles

1.  **Centralized Data Logic**: All data persistence logic (reading from or writing to a database) is centralized within the **Electron Main Process**. The UI layers (both Electron's renderer and the web dashboard) are forbidden from accessing data sources directly.
2.  **Feature-Based Modularity**: Code is organized by feature (`src/features`) to promote encapsulation and separation of concerns. A new feature should be self-contained within its own directory.
3.  **Single Source of Truth for Schema**: The schema for the local SQLite database is defined in a single location: `src/common/config/schema.js`. Any change to the database structure **must** be updated here.

---

## I. Electron Application Architecture (`src/`)

This section details the architecture of the core desktop application.

### 1. Overall Pattern: Service-Repository

The Electron app's logic is primarily built on a **Service-Repository** pattern, with the Views being the HTML/JS files in the `src/app` and `src/features` directories.

-   **Views** (`*.html`, `*View.js`): The UI layer. Views are responsible for rendering the interface and capturing user interactions. They are intentionally kept "dumb" and delegate all significant logic to a corresponding Service.
-   **Services** (`*Service.js`): Services contain the application's business logic. They act as the intermediary between Views and Repositories. For example, `sttService` contains the logic for STT, while `summaryService` handles the logic for generating summaries.
-   **Repositories** (`*.repository.js`): Repositories are responsible for all data access. They are the *only* part of the application that directly interacts with `sqliteClient`.

**Location of Modules:**
-   **Feature-Specific**: If a service or repository is used by only one feature, it should reside within that feature's directory (e.g., `src/features/listen/summary/summaryService.js`).
-   **Common**: If a service or repository is shared across multiple features (like `authService` or `userRepository`), it must be placed in `src/common/services/` or `src/common/repositories/` respectively.

### 2. Data Persistence: The Repository Pattern


-   **SQLite**: The default data store for all users, especially those not logged in. This ensures full offline functionality. The low-level client is `src/common/services/sqliteClient.js`.

The application uses the local SQLite database for all data persistence.

**How it works:**
1.  **Service Call**: A service makes a call to a high-level repository function, like `sessionRepository.create('ask')`. The service is unaware of the underlying database.
2.  **Execution**: The SQLite repository executes the data operation.


---

## II. The Personalize Feature and LLM Prompt Construction

The "Personalize" feature allows users to define a single, custom prompt that influences the AI's behavior and responses. This prompt is stored in the local SQLite database and is integrated into the system prompt sent to the Large Language Model (LLM).

**Data Storage and Access:**
-   The personalize prompt is stored in the `personalize` table within the SQLite database.
-   It is accessed via `src/features/common/repositories/preset/sqlite.repository.js` (which, despite its name, now handles the single personalize prompt) and exposed through `settingsService.js`.

**LLM Prompt Construction Flow:**
When a user interacts with the AI (e.g., by asking a question), the final prompt sent to the LLM is constructed through a multi-step process:

1.  **User Query:** The user's direct input (e.g., "What is the capital of France?").
2.  **Personalize Prompt Retrieval:** `askService.js` fetches the single personalize prompt from the database using `settingsService.getPersonalizePrompt()`.
3.  **System Prompt Building (`promptBuilder.js`):**
    -   The `src/features/common/prompts/promptBuilder.js` module is responsible for assembling the core "system prompt." This system prompt acts as a set of instructions or a persona for the LLM, guiding its overall behavior.
    -   The personalize prompt is passed as a `customPrompt` argument to `promptBuilder.getSystemPrompt()`. This means your custom instructions are directly embedded within the system prompt.
    -   Other elements, such as general instructions for the AI's role (e.g., "You are an interview assistant") and rules for using tools like Google Search, are also included in this system prompt.
4.  **Final Message Assembly (`askService.js`):**
    -   `askService.js` combines the constructed system prompt with the user's query and any other relevant context (e.g., conversation history, screenshot data for multimodal models) into a structured message format (e.g., an array of role-based messages).
    -   This complete message is then sent to the selected LLM.

**System Prompt vs. Personalize Prompt:**
-   **Personalize Prompt:** This is the specific, user-defined text (e.g., "Always respond concisely and professionally.") that you configure in the "Personalize" tab. It's your direct instruction to the AI.
-   **System Prompt:** This is the comprehensive set of instructions that the application sends to the LLM. It *includes* your personalize prompt, along with other predefined instructions that ensure the AI functions correctly within the Jarvis ecosystem (e.g., formatting requirements, how to use internal tools, general behavioral guidelines). The personalize prompt effectively customizes a part of this larger system prompt.

---

## III. Core Feature Flows

Jarvis operates on a new interaction model centered around two main user-initiated flows: **Ask** and **Guide**. These are supported by a silent, background context-gathering engine.

### 1. Background Context Engine

The background context engine is the foundation of Jarvis's contextual awareness. The user can toggle this engine on and off using the "Listen" button in the UI or the `Cmd+L` shortcut. When active, the application enters "Listen" mode.

This engine has two primary responsibilities:
1.  **Silent Context Gathering**: It captures audio and screen context to provide real-time information for the on-demand Ask and Guide flows.
2.  **Live Analysis**: It periodically analyzes the conversation to generate insights. These insights are not presented in an interruptive manner (which replaces the old "afterSession" state), but are displayed passively in the "Live Insights" tab for the user to review at their convenience.

**Data Flow:**
1.  **Audio Capture (`sttService`)**: Captures both user microphone and system audio into two separate, real-time STT streams.
2.  **Live Transcription (`sttService` -> UI)**: The raw transcription is still sent to the Listen window for user visibility.
3.  **Conversation Aggregation (`listenService`)**: Completed sentences are passed to the `summaryService`.
4.  **Periodic Analysis (`summaryService`)**: The service analyzes the conversation periodically (e.g., every 3 turns). It generates a structured analysis of the conversation. This analysis is used for two purposes: it is stored in memory as context for the Ask and Guide flows, and it is sent to the UI to populate the "Live Insights" tab.

### 2. On-Demand Interaction Flows

These flows are triggered directly by the user via keyboard shortcuts. They use the context gathered by the background engine to provide relevant, on-demand responses.

#### A. Ask Mode (`Cmd+Enter`)

This flow is for when the user has a **specific question**.

**Data Flow:**
1.  **User Trigger**: The user types a query in the Ask window and/or presses `Cmd+Enter`.
2.  **Context Gathering (`askService`)**: The `askService.sendMessage` function is called. It gathers:
    *   **Visual Context**: A real-time screenshot.
    *   **Audio Context**: The recent conversation history from `listenService`.
    *   **User Query**: The text typed by the user (if any).
3.  **LLM Call**: The context is combined into a `fullPrompt` and sent to the LLM with a prompt profile optimized for question-answering (`jarvis`).
4.  **Response**: The answer is streamed to the Ask window.

#### B. Guide Mode (`Cmd+'`) 

This flow is for when the user wants **proactive guidance** on what to do or say next, without asking a specific question.

**Data Flow:**
1.  **User Trigger**: The user presses `Cmd+'`.
2.  **Context Gathering (`askService`)**: The new `askService.getGuidance` function is called. It gathers:
    *   **Visual Context**: A real-time screenshot.
    *   **Audio Context**: The recent conversation history from `listenService`.
    *   **Analysis Context**: The most recent silent analysis from `summaryService.getPreviousAnalysisResult()`.
3.  **LLM Call**: The context is combined and sent to the LLM with a new, specialized prompt profile (`guidance`) that asks the AI to suggest the best next steps.
4.  **Response**: The suggested guidance is streamed to the Ask window.

### 3. AI Prompting Profiles

The application uses a system of prompt profiles to instruct the AI on how to behave for different tasks. These profiles are defined in `src/features/common/prompts/promptTemplates.js`. The three core profiles are:

*   **`jarvis` (The "Ask" Profile)**: A general-purpose assistant that follows a decision tree to answer questions. It first tries to answer a direct question from the conversation, then defines proper nouns, then solves problems on the screen, and finally falls back to a neutral state if it can't determine the user's intent. It is the default for the `Cmd+Enter` "Ask" feature.

*   **`guidance` (The "Guide" Profile)**: A proactive assistant designed to provide actionable next steps. It is triggered by the `Cmd+'` shortcut and its goal is to answer the implicit question, "What should I do or say next?" based on the full context.

*   **`jarvis_analysis` (The Background Engine Profile)**: A silent, efficient summarizer. It runs automatically in the background to create a running summary of the conversation. This summary is then used as context for the `jarvis` and `guidance` profiles, giving them a memory of what was discussed. It is also the source of the content for the "Live Insights" tab.




---

## IV. Web Dashboard Architecture (`jarvis_web/`)

This section details the architecture of the Next.js web application, which serves as the user-facing dashboard for account management and viewing data from the local database via the Electron main process.

### 1. Frontend, Backend, and Main Process Communication

The web dashboard has a more complex, three-part architecture:

1.  **Next.js Frontend (`app/`):** The React-based user interface.
2.  **Node.js Backend (`backend_node/`):** An Express.js server that acts as an intermediary.
3.  **Electron Main Process (`src/`):** The ultimate authority for all local data access.

Crucially, **the web dashboard's backend cannot access the local SQLite database directly**. It must communicate with the Electron main process to request data.

### 2. The IPC Data Flow

When the web frontend needs data that resides in the local SQLite database, it follows this precise flow:

1.  **HTTP Request**: The Next.js frontend makes a standard API call to its own Node.js backend (e.g., `GET /api/conversations`).
2.  **IPC Request**: The Node.js backend receives the HTTP request. It **does not** contain any database logic. Instead, it uses the `ipcRequest` helper from `backend_node/ipcBridge.js`.
3.  **IPC Emission**: `ipcRequest` sends an event to the Electron main process over an IPC channel (`web-data-request`). It passes three things: the desired action (e.g., `'get-sessions'`), a unique channel name for the response, and a payload.
4.  **Main Process Listener**: The Electron main process has a listener (`ipcMain.on('web-data-request', ...)`) that receives this request. It identifies the action and calls the appropriate **Service** or **Repository** to fetch the data from the SQLite database.
5.  **IPC Response**: Once the data is retrieved, the main process sends it back to the web backend using the unique response channel provided in the request.
6.  **HTTP Response**: The web backend's `ipcRequest` promise resolves with the data, and the backend sends it back to the Next.js frontend as a standard JSON HTTP response.

This round-trip ensures our core principle of centralizing data logic in the main process is never violated.

### 3. "My Activity" Page Data Flow

To illustrate the IPC data flow, here is the end-to-end sequence for populating the "My Activity" page with the user's conversation history:

1.  **Frontend Request**: The React component at `jarvis_web/app/activity/page.tsx` calls the `getSessions()` function from the `utils/api.ts` module.
2.  **API Call**: `getSessions()` makes a `fetch` request to the local web dashboard's backend at `GET /api/conversations`.
3.  **Backend Route**: The Express server (`backend_node/routes/conversations.js`) receives the request. It has no database logic itself.
4.  **IPC Bridge**: The route handler calls `ipcRequest`, which sends an IPC message to the Electron main process. The message channel is `web-data-request`, and the payload includes the specific action to perform: `'get-sessions'`.
5.  **Main Process Listener**: A listener in `src/index.js` on the `web-data-request` channel receives the message.
6.  **Repository Request**: The handler identifies the `'get-sessions'` action and calls `sessionRepository.getAllByUserId()`.
7.  **User ID Injection**: The `sessionRepository` is an adapter (`repositories/session/index.js`). Before calling the database, it retrieves the current user's ID from the `authService`. This step is crucial, as it tells the database *which* user's sessions to fetch. The `authService` provides a default, anonymous user ID for local-only operation.
8.  **Database Query**: The adapter calls the function in `sqlite.repository.js`, which executes the final `SELECT * FROM sessions WHERE uid = ?` SQL query against the local SQLite database.
9.  **Return Trip**: The query results are returned all the way back up the chain: from the database to the repository, to the main process, over IPC to the web backend, and finally as an HTTP JSON response to the frontend, where the React component renders the activity list.

