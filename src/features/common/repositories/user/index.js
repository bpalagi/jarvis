const sqliteRepository = require('./sqlite.repository');

const userRepositoryAdapter = {
    findOrCreate: (user) => {
        return sqliteRepository.findOrCreate(user);
    },
    
    getById: (uid) => {
        return sqliteRepository.getById(uid);
    },

    update: (uid, updateData) => {
        return sqliteRepository.update(uid, updateData);
    },

    deleteById: (uid) => {
        return sqliteRepository.deleteById(uid);
    }
};

module.exports = {
    ...userRepositoryAdapter
}; 