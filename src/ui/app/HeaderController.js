import './MainHeader.js';
import './PermissionHeader.js';

class HeaderTransitionManager {
    constructor() {
        this.headerContainer      = document.getElementById('header-container');
        this.currentHeaderType    = null;   // 'welcome' | 'apikey' | 'main' | 'permission'
        this.apiKeyHeader         = null;
        this.mainHeader            = null;

        /**
         * only one header window is allowed
         * @param {'welcome'|'apikey'|'main'|'permission'} type
         */
        this.ensureHeader = (type) => {
            console.log('[HeaderController] ensureHeader: Ensuring header of type:', type);
            if (this.currentHeaderType === type) {
                console.log('[HeaderController] ensureHeader: Header of type:', type, 'already exists.');
                return;
            }

            this.headerContainer.innerHTML = '';
            
                        this.mainHeader = null;

            // Create new header element
            this.mainHeader = document.createElement('main-header');
            this.headerContainer.appendChild(this.mainHeader);
            this.mainHeader.startSlideInAnimation?.();

            this.currentHeaderType = type;
            this.notifyHeaderState(type === 'permission' ? 'apikey' : type); // Keep permission state as apikey for compatibility
        };

        console.log('[HeaderController] Manager initialized');



        this._bootstrap();

        if (window.api) {
            window.api.headerController.onUserStateChanged((event, userState) => {
                console.log('[HeaderController] Received user state change:', userState);
                this.handleStateUpdate(userState);
            });



        }
    }

    notifyHeaderState(stateOverride) {
        const state = stateOverride || this.currentHeaderType || 'apikey';
        if (window.api) {
            window.api.headerController.sendHeaderStateChanged(state);
        }
    }

    async _bootstrap() {
        // Directly call handleStateUpdate with a dummy user state
        this.handleStateUpdate({});
    }


    //////// after_modelStateService ////////
    async handleStateUpdate(userState) {
        this.transitionToMainHeader();
    }

    async transitionToMainHeader(animate = true) {
        if (this.currentHeaderType === 'main') {
            return this._resizeForMain();
        }

        await this._resizeForMain();
        this.ensureHeader('main');
    }

    async _resizeForMain() {
        if (!window.api) return;
        console.log('[HeaderController] _resizeForMain: Resizing window to 600x60');
        return window.api.headerController.resizeHeaderWindow({ width: 600, height: 60 }).catch(() => {});
    }






}

window.addEventListener('DOMContentLoaded', () => {
    new HeaderTransitionManager();
});
