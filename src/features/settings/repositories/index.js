const sqliteRepository = require('./sqlite.repository');

const settingsRepositoryAdapter = {
    getPersonalizePrompt: () => {
        return sqliteRepository.getPersonalizePrompt();
    },

    updatePersonalizePrompt: (options) => {
        return sqliteRepository.updatePersonalizePrompt(options);
    },

    getAutoUpdate: () => {
        return sqliteRepository.getAutoUpdate();
    },

    setAutoUpdate: (isEnabled) => {
        return sqliteRepository.setAutoUpdate(isEnabled);
    },
};

module.exports = settingsRepositoryAdapter;