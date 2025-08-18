const { BrowserWindow, shell } = require('electron');
const fetch = require('node-fetch');
const encryptionService = require('./encryptionService');

const sessionRepository = require('../repositories/session');
const providerSettingsRepository = require('../repositories/providerSettings');
const permissionService = require('./permissionService');



class AuthService {
    constructor() {
        this.currentUserId = 'default_user';
        this.currentUserMode = 'local';
        this.currentUser = null;

        
    }

    async signOut() {
        try {
            await sessionRepository.endAllActiveSessions();
            console.log('[AuthService] User sign-out initiated successfully.');
        } catch (error) {
            console.error('[AuthService] Error signing out:', error);
        }
    }
    
    

    getCurrentUserId() {
        return this.currentUserId;
    }

    getCurrentUser() {
        return {
            uid: this.currentUserId, // returns 'default_user'
            email: 'contact@jarvis.com',
            displayName: 'Default User',
            mode: 'local',
            isLoggedIn: false,
        };
    }
}

const authService = new AuthService();
module.exports = authService; 