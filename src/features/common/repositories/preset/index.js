const sqliteRepository = require('./sqlite.repository');

const personalizeRepositoryAdapter = {
    getPersonalizePrompt: () => {
        return sqliteRepository.getPersonalizePrompt();
    },

    updatePersonalizePrompt: (options) => {
        return sqliteRepository.updatePersonalizePrompt(options);
    }
};

module.exports = personalizeRepositoryAdapter;