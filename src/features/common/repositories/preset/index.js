const sqliteRepository = require('./sqlite.repository');

const presetRepositoryAdapter = {
    getPresets: () => {
        return sqliteRepository.getPresets();
    },

    getPresetTemplates: () => {
        return sqliteRepository.getPresetTemplates();
    },

    create: (options) => {
        return sqliteRepository.create(options);
    },

    update: (id, options) => {
        return sqliteRepository.update(id, options);
    },

    delete: (id) => {
        return sqliteRepository.delete(id);
    },
};

module.exports = presetRepositoryAdapter; 