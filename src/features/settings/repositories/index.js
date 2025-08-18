const sqliteRepository = require('./sqlite.repository');

const settingsRepositoryAdapter = {
    getPresets: () => {
        return sqliteRepository.getPresets();
    },

    getPresetTemplates: () => {
        return sqliteRepository.getPresetTemplates();
    },

    createPreset: (options) => {
        return sqliteRepository.createPreset(options);
    },

    updatePreset: (id, options) => {
        return sqliteRepository.updatePreset(id, options);
    },

    deletePreset: (id) => {
        return sqliteRepository.deletePreset(id);
    },

    getAutoUpdate: () => {
        return sqliteRepository.getAutoUpdate();
    },

    setAutoUpdate: (isEnabled) => {
        return sqliteRepository.setAutoUpdate(isEnabled);
    },
};

module.exports = settingsRepositoryAdapter;
