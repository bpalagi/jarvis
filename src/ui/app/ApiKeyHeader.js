import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

export class ApiKeyHeader extends LitElement {
    //////// after_modelStateService ////////
    static properties = {
        llmApiKey: { type: String },
        sttApiKey: { type: String },
        llmProvider: { type: String },
        sttProvider: { type: String },
        isLoading: { type: Boolean },
        errorMessage: { type: String },
        successMessage: { type: String },
        providers: { type: Object, state: true },
        backCallback: { type: Function },
        llmError: { type: String },
        sttError: { type: String },
    };
    //////// after_modelStateService ////////

    static styles = css`
        :host {
            display: block;
            font-family:
                'Inter',
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                Roboto,
                sans-serif;
        }
        * {
            box-sizing: border-box;
        }
        .container {
            width: 100%;
            height: 100%;
            padding: 24px 16px;
            background: rgba(0, 0, 0, 0.64);
            box-shadow: 0px 0px 0px 1.5px rgba(255, 255, 255, 0.64) inset;
            border-radius: 16px;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 24px;
            display: flex;
            -webkit-app-region: drag;
        }
        .header {
            width: 100%;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 8px;
        }
        .close-button {
            -webkit-app-region: no-drag;
            position: absolute;
            top: 16px;
            right: 16px;
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 5px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            z-index: 10;
            font-size: 16px;
            line-height: 1;
            padding: 0;
        }
        .close-button:hover {
            background: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.9);
        }
        .back-button {
            -webkit-app-region: no-drag;
            padding: 8px;
            left: 0px;
            top: -7px;
            position: absolute;
            background: rgba(132.6, 132.6, 132.6, 0.8);
            border-radius: 16px;
            border: 0.5px solid rgba(255, 255, 255, 0.5);
            justify-content: center;
            align-items: center;
            gap: 4px;
            display: flex;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .back-button:hover {
            background: rgba(150, 150, 150, 0.9);
        }
        .arrow-icon-left {
            border: solid #dcdcdc;
            border-width: 0 1.2px 1.2px 0;
            display: inline-block;
            padding: 3px;
            transform: rotate(135deg);
        }
        .back-button-text {
            color: white;
            font-size: 12px;
            font-weight: 500;
            padding-right: 4px;
        }
        .title {
            color: white;
            font-size: 14px;
            font-weight: 700;
        }
        .section {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .row {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .label {
            color: white;
            font-size: 12px;
            font-weight: 600;
        }
        .provider-selector {
            display: flex;
            width: 240px;
            overflow: hidden;
            border-radius: 12px;
            border: 0.5px solid rgba(255, 255, 255, 0.5);
        }
        .provider-button {
            -webkit-app-region: no-drag;
            padding: 4px 8px;
            background: rgba(20.4, 20.4, 20.4, 0.32);
            color: #dcdcdc;
            font-size: 11px;
            font-weight: 450;
            letter-spacing: 0.11px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s ease;
            flex: 1;
        }
        .provider-button:hover {
            background: rgba(80, 80, 80, 0.48);
        }
        .provider-button[data-status='active'] {
            background: rgba(142.8, 142.8, 142.8, 0.48);
            color: white;
        }
        .api-input {
            -webkit-app-region: no-drag;
            width: 240px;
            padding: 10px 8px;
            background: rgba(61.2, 61.2, 61.2, 0.8);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.24);
            color: white;
            font-size: 11px;
            text-overflow: ellipsis;
            font-family: inherit;
            line-height: inherit;
        }
        select.api-input {
            -webkit-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
        }
        select.api-input option {
            background: #333;
            color: white;
        }
        .api-input::placeholder {
            color: #a0a0a0;
        }
        .confirm-button-container {
            width: 100%;
            display: flex;
            justify-content: flex-end;
        }
        .confirm-button {
            -webkit-app-region: no-drag;
            width: 240px;
            padding: 8px;
            background: rgba(132.6, 132.6, 132.6, 0.8);
            box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.16);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.5);
            color: white;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .confirm-button:hover {
            background: rgba(150, 150, 150, 0.9);
        }
        .confirm-button:disabled {
            background: rgba(255, 255, 255, 0.12);
            color: #bebebe;
            border: 0.5px solid rgba(255, 255, 255, 0.24);
            box-shadow: none;
            cursor: not-allowed;
        }
        .footer {
            width: 100%;
            text-align: center;
            color: #dcdcdc;
            font-size: 12px;
            font-weight: 500;
            line-height: 18px;
        }
        .footer-link {
            text-decoration: underline;
            cursor: pointer;
            -webkit-app-region: no-drag;
        }
        .error-message,
        .success-message {
            position: absolute;
            bottom: 70px;
            left: 16px;
            right: 16px;
            text-align: center;
            font-size: 11px;
            font-weight: 500;
            padding: 4px;
            border-radius: 4px;
        }
        .error-message {
            color: rgba(239, 68, 68, 0.9);
        }
        .success-message {
            color: rgba(74, 222, 128, 0.9);
        }
        .message-fade-out {
            animation: fadeOut 3s ease-in-out forwards;
        }
        @keyframes fadeOut {
            0% {
                opacity: 1;
            }
            66% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }
        .sliding-out {
            animation: slideOut 0.3s ease-out forwards;
        }
        @keyframes slideOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
        .api-input.invalid {
            outline: 1px solid #ff7070;
            outline-offset: -1px;
        }
        .input-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
        }
        .inline-error-message {
            color: #ff7070;
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.11px;
            word-wrap: break-word;
            width: 240px;
        }
    `;


    constructor() {
        super();
        this.isLoading = false;
        this.errorMessage = '';
        this.successMessage = '';
        this.messageTimestamp = 0;
        //////// after_modelStateService ////////
        this.llmApiKey = '';
        this.sttApiKey = '';
        this.llmProvider = 'gemini';
        this.sttProvider = 'gemini';
        this.providers = { llm: [], stt: [] }; // 초기화
        this.backCallback = () => {};
        this.llmError = '';
        this.sttError = '';

        // Professional operation management system
        this.activeOperations = new Map();
        this.operationTimeouts = new Map();
        this.connectionState = 'idle'; // idle, connecting, connected, failed, disconnected
        this.lastStateChange = Date.now();
        this.retryCount = 0;
        this.maxRetries = 3;
        this.baseRetryDelay = 1000;

        // Backpressure and resource management
        this.operationQueue = [];
        this.maxConcurrentOperations = 2;
        this.maxQueueSize = 5;
        this.operationMetrics = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            timeouts: 0,
            averageResponseTime: 0,
        };

        // Configuration
        this.ipcTimeout = 10000; // 10s for IPC calls
        this.operationTimeout = 15000; // 15s for complex operations

        // Health monitoring system
        this.healthCheck = {
            enabled: false,
            intervalId: null,
            intervalMs: 30000, // 30s
            lastCheck: 0,
            consecutiveFailures: 0,
            maxFailures: 3,
        };

        //////// after_modelStateService ////////

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
        this.handleProviderChange = this.handleProviderChange.bind(this);
        this.handleLlmProviderChange = this.handleLlmProviderChange.bind(this);
        this.handleSttProviderChange = this.handleSttProviderChange.bind(this);
        this.handleMessageFadeEnd = this.handleMessageFadeEnd.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        this.dispatchEvent(new CustomEvent('content-changed', { bubbles: true, composed: true }));
    }

    handleBack() {
        if (this.backCallback) {
            this.backCallback();
        }
    }

    shouldFadeMessage(type) {
        const hasMessage = type === 'error' ? this.errorMessage : this.successMessage;
        return hasMessage && this.messageTimestamp > 0 && Date.now() - this.messageTimestamp > 100;
    }

    openPrivacyPolicy() {
        console.log('🔊 openPrivacyPolicy ApiKeyHeader');
        if (window.api?.common) {
            window.api.common.openExternal('https://jarvis.com/privacy-policy');
        }
    }

    render() {
        const llmNeedsApiKey = true;
        const sttNeedsApiKey = true;

        const isButtonDisabled =
            this.isLoading ||
            !this.llmApiKey.trim() ||
            !this.sttApiKey.trim();

        const llmProviderName = this.providers.llm.find(p => p.id === this.llmProvider)?.name || this.llmProvider;

        return html`
            <div class="container">
                <button class="close-button" @click=${this.handleClose}>×</button>
                <div class="header">
                    <div class="back-button" @click=${this.handleBack}>
                        <i class="arrow-icon-left"></i>
                        <div class="back-button-text">Back</div>
                    </div>
                    <div class="title">Use Personal API keys</div>
                </div>

                <!-- LLM Section -->
                <div class="section">
                    <div class="row">
                        <div class="label">1. Select LLM Provider</div>
                        <div class="provider-selector">
                            ${this.providers.llm.map(
                                p => html`
                                    <button
                                        class="provider-button"
                                        data-status=${this.llmProvider === p.id ? 'active' : 'default'}
                                        @click=${e => this.handleLlmProviderChange(e, p.id)}
                                    >
                                        ${p.name}
                                    </button>
                                `
                            )}
                        </div>
                    </div>
                    <div class="row">
                        <div class="label">2. Enter API Key</div>
                        <div class="input-wrapper">
                            <input
                                type="password"
                                class="api-input ${this.llmError ? 'invalid' : ''}"
                                placeholder="Enter your ${llmProviderName} API key"
                                .value=${this.llmApiKey}
                                @input=${e => {
                                    this.llmApiKey = e.target.value;
                                    this.llmError = '';
                                }}
                                ?disabled=${this.isLoading}
                            />
                            ${this.llmError ? html`<div class="inline-error-message">${this.llmError}</div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- STT Section -->
                <div class="section">
                    <div class="row">
                        <div class="label">3. Select STT Provider</div>
                        <div class="provider-selector">
                            ${this.providers.stt.map(
                                p => html`
                                    <button
                                        class="provider-button"
                                        data-status=${this.sttProvider === p.id ? 'active' : 'default'}
                                        @click=${e => this.handleSttProviderChange(e, p.id)}
                                    >
                                        ${p.name}
                                    </button>
                                `
                            )}
                        </div>
                    </div>
                    <div class="row">
                        <div class="label">4. Enter STT API Key</div>
                        ${this.sttProvider === 'ollama'
                            ? html`
                                  <div class="api-input" style="background: transparent; border: none; text-align: right; color: #a0a0a0;">
                                      STT not supported by Ollama
                                  </div>
                              `
                            : this.sttProvider === 'whisper'
                              ? html`
                                    <div class="input-wrapper">
                                        <select
                                            class="api-input ${this.sttError ? 'invalid' : ''}"
                                            .value=${this.selectedSttModel || ''}
                                            @change=${e => {
                                                this.handleSttModelChange(e);
                                                this.sttError = '';
                                            }}
                                            ?disabled=${this.isLoading}
                                        >
                                            <option value="">Select a model...</option>
                                            ${[
                                                { id: 'whisper-tiny', name: 'Whisper Tiny (39M)' },
                                                { id: 'whisper-base', name: 'Whisper Base (74M)' },
                                                { id: 'whisper-small', name: 'Whisper Small (244M)' },
                                                { id: 'whisper-medium', name: 'Whisper Medium (769M)' },
                                            ].map(model => html` <option value="${model.id}">${model.name}</option> `)}
                                        </select>
                                        ${this.sttError ? html`<div class="inline-error-message">${this.sttError}</div>` : ''}
                                    </div>
                                `
                              : html`
                                    <div class="input-wrapper">
                                        <input
                                            type="password"
                                            class="api-input ${this.sttError ? 'invalid' : ''}"
                                            placeholder="Enter your STT API key"
                                            .value=${this.sttApiKey}
                                            @input=${e => {
                                                this.sttApiKey = e.target.value;
                                                this.sttError = '';
                                            }}
                                            ?disabled=${this.isLoading}
                                        />
                                        ${this.sttError ? html`<div class="inline-error-message">${this.sttError}</div>` : ''}
                                    </div>
                                `}
                    </div>
                </div>
                <div class="confirm-button-container">
                    <button class="confirm-button" @click=${this.handleSubmit} ?disabled=${isButtonDisabled}>
                        ${this.isLoading
                            ? 'Setting up...'
                            : this.installingModel
                              ? `Installing ${this.installingModel}...`
                              : Object.keys(this.whisperInstallingModels).length > 0
                                ? `Downloading...`
                                : 'Confirm'}
                    </button>
                </div>

                <div class="footer">
                    Get your API key from: OpenAI | Google | Anthropic
                    <br />
                    Jarvis does not collect your personal data —
                    <span class="footer-link" @click=${this.openPrivacyPolicy}>See details</span>
                </div>

                <div class="error-message ${this.shouldFadeMessage('error') ? 'message-fade-out' : ''}" @animationend=${this.handleMessageFadeEnd}>
                    ${this.errorMessage}
                </div>
                <div
                    class="success-message ${this.shouldFadeMessage('success') ? 'message-fade-out' : ''}"
                    @animationend=${this.handleMessageFadeEnd}
                >
                    ${this.successMessage}
                </div>
            </div>
        `;
    }
}

customElements.define('apikey-header', ApiKeyHeader);
