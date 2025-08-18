const sqliteRepository = require('./sqlite.repository');

// The adapter layer that injects the UID
const askRepositoryAdapter = {
    addAiMessage: ({ sessionId, role, content, model }) => {
        return sqliteRepository.addAiMessage({ sessionId, role, content, model });
    },
    getAllAiMessagesBySessionId: (sessionId) => {
        return sqliteRepository.getAllAiMessagesBySessionId(sessionId);
    }
};

module.exports = askRepositoryAdapter; 