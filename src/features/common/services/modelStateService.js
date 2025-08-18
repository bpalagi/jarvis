const { EventEmitter } = require('events');
const Store = require('electron-store');
const { PROVIDERS, getProviderClass } = require('../ai/factory');
const encryptionService = require('./encryptionService');
const providerSettingsRepository = require('../repositories/providerSettings');

class ModelStateService extends EventEmitter {
    constructor() {
        super();
        // electron-store는 오직 레거시 데이터 마이그레이션 용도로만 사용됩니다.
        this.store = new Store({ name: 'jarvis-model-state' });
    }

    async initialize() {
        console.log('[ModelStateService] Initializing one-time setup...');
        await this._autoSelectAvailableModels();
        console.log('[ModelStateService] One-time setup complete.');
    }

    async _autoSelectAvailableModels() {
        const selectedModels = await this.getSelectedModels();

        if (!selectedModels.llm) {
            const availableLlmModels = await this.getAvailableModels('llm');
            if (availableLlmModels.length > 0) {
                await this.setSelectedModel('llm', availableLlmModels[0].id);
            }
        }

        if (!selectedModels.stt) {
            const availableSttModels = await this.getAvailableModels('stt');
            if (availableSttModels.length > 0) {
                await this.setSelectedModel('stt', availableSttModels[0].id);
            }
        }
    }

    async getLiveState() {
        const providerSettings = await providerSettingsRepository.getAll();
        const apiKeys = {};
        Object.keys(PROVIDERS).forEach(provider => {
            const setting = providerSettings.find(s => s.provider === provider);
            apiKeys[provider] = setting?.api_key || null;
        });

        const activeSettings = await providerSettingsRepository.getActiveSettings();
        const selectedModels = {
            llm: activeSettings.llm?.selected_llm_model || null,
            stt: activeSettings.stt?.selected_stt_model || null
        };
        
        return { apiKeys, selectedModels };
    }

    async getAllApiKeys() {
        const allSettings = await providerSettingsRepository.getAll();
        const apiKeys = {};
        allSettings.forEach(s => {
            if (s.provider !== 'openai-jarvis') {
                apiKeys[s.provider] = s.api_key;
            }
        });
        return apiKeys;
    }

    async setApiKey(provider, key) {
        console.log(`[ModelStateService] setApiKey for ${provider}`);
        if (!provider) {
            throw new Error('Provider is required');
        }

        const validationResult = await this.validateApiKey(provider, key);
        if (!validationResult.success) {
            console.warn(`[ModelStateService] API key validation failed for ${provider}: ${validationResult.error}`);
            return validationResult;
        }

        const existingSettings = await providerSettingsRepository.getByProvider(provider) || {};
        await providerSettingsRepository.upsert(provider, { ...existingSettings, api_key: key });
        
        this.emit('state-updated', await this.getLiveState());
        this.emit('settings-updated');
        return { success: true };
    }

    async hasValidApiKey() {
        const allSettings = await providerSettingsRepository.getAll();
        return allSettings.some(s => s.api_key && s.api_key.trim().length > 0);
    }

    async removeApiKey(provider) {
        const setting = await providerSettingsRepository.getByProvider(provider);
        if (setting && setting.api_key) {
            await providerSettingsRepository.upsert(provider, { ...setting, api_key: null });
            this.emit('state-updated', await this.getLiveState());
            this.emit('settings-updated');
            return true;
        }
        return false;
    }

    async getSelectedModels() {
        const active = await providerSettingsRepository.getActiveSettings();
        return {
            llm: active.llm?.selected_llm_model || null,
            stt: active.stt?.selected_stt_model || null,
        };
    }
    
    async setSelectedModel(type, modelId) {
        const provider = 'gemini'; // Only Gemini is supported
        if (!provider) {
            console.warn(`[ModelStateService] No provider found for model ${modelId}`);
            return false;
        }

        const existingSettings = await providerSettingsRepository.getByProvider(provider) || {};
        const newSettings = { ...existingSettings };

        if (type === 'llm') {
            newSettings.selected_llm_model = modelId;
        } else {
            newSettings.selected_stt_model = modelId;
        }
        
        await providerSettingsRepository.upsert(provider, newSettings);
        await providerSettingsRepository.setActiveProvider(provider, type);
        
        console.log(`[ModelStateService] Selected ${type} model: ${modelId} (provider: ${provider})`);
        
        this.emit('state-updated', await this.getLiveState());
        this.emit('settings-updated');
        return true;
    }

    async getCurrentModelInfo(type) {
        const activeSetting = await providerSettingsRepository.getActiveProvider(type);
        if (!activeSetting) return null;
        
        const model = type === 'llm' ? activeSetting.selected_llm_model : activeSetting.selected_stt_model;
        if (!model) return null;

        return {
            provider: activeSetting.provider,
            model: model,
            apiKey: activeSetting.api_key,
        };
    }

    async getAvailableModels(type) {
        const allSettings = await providerSettingsRepository.getAll();
        const available = [];
        const modelListKey = type === 'llm' ? 'llmModels' : 'sttModels';

        for (const setting of allSettings) {
            if (!setting.api_key) continue;

            const providerId = setting.provider;
            if (PROVIDERS[providerId]?.[modelListKey]) {
                available.push(...PROVIDERS[providerId][modelListKey]);
            }
        }
        return [...new Map(available.map(item => [item.id, item])).values()];
    }

    // --- 핸들러 및 유틸리티 메서도 ---

    async validateApiKey(provider, key) {
        if (!key || key.trim() === '') {
            return { success: false, error: 'API key cannot be empty.' };
        }
        const ProviderClass = getProviderClass(provider);
        if (!ProviderClass || typeof ProviderClass.validateApiKey !== 'function') {
            return { success: true };
        }
        try {
            return await ProviderClass.validateApiKey(key);
        } catch (error) {
            return { success: false, error: 'An unexpected error occurred during validation.' };
        }
    }

    getProviderConfig() {
        const config = {};
        for (const key in PROVIDERS) {
            const { handler, ...rest } = PROVIDERS[key];
            config[key] = rest;
        }
        return config;
    }
    
    /*-------------- Compatibility Helpers --------------*/
    async handleRemoveApiKey(provider) {
        const success = await this.removeApiKey(provider);
        if (success) {
            const selectedModels = await this.getSelectedModels();
            if (!selectedModels.llm && !selectedModels.stt) {
                this.emit('force-show-apikey-header');
            }
        }
        return success;
    }

    async handleValidateKey(provider, key) {
        return await this.setApiKey(provider, key);
    }

    async handleSetSelectedModel(type, modelId) {
        return await this.setSelectedModel(type, modelId);
    }

    async areProvidersConfigured() {
        const allSettings = await providerSettingsRepository.getAll();
        const apiKeyMap = {};
        allSettings.forEach(s => apiKeyMap[s.provider] = s.api_key);
        // LLM
        const hasLlmKey = Object.entries(apiKeyMap).some(([provider, key]) => {
            if (!key) return false;
            return PROVIDERS[provider]?.llmModels?.length > 0;
        });
        // STT
        const hasSttKey = Object.entries(apiKeyMap).some(([provider, key]) => {
            if (!key) return false;
            return PROVIDERS[provider]?.sttModels?.length > 0;
        });
        return hasLlmKey && hasSttKey;
    }
}

const modelStateService = new ModelStateService();
module.exports = modelStateService;