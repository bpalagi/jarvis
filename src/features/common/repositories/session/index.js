const sqliteRepository = require('./sqlite.repository');

const sessionRepositoryAdapter = {
    getById: (id) => sqliteRepository.getById(id),
    
    create: (type = 'ask') => {
        return sqliteRepository.create(type);
    },
    
    getAllByUserId: () => {
        return sqliteRepository.getAllByUserId();
    },

    updateTitle: (id, title) => sqliteRepository.updateTitle(id, title),
    
    deleteWithRelatedData: (id) => sqliteRepository.deleteWithRelatedData(id),

    end: (id) => sqliteRepository.end(id),

    updateType: (id, type) => sqliteRepository.updateType(id, type),

    touch: (id) => sqliteRepository.touch(id),

    getOrCreateActive: (requestedType = 'ask') => {
        return sqliteRepository.getOrCreateActive(requestedType);
    },

    endAllActiveSessions: () => {
        return sqliteRepository.endAllActiveSessions();
    },
};

module.exports = sessionRepositoryAdapter; 