const sqliteRepository = require('./sqlite.repository');

const summaryRepositoryAdapter = {
    saveSummary: ({ sessionId, tldr, text, bullet_json, action_json, model }) => {
        return sqliteRepository.saveSummary({ sessionId, tldr, text, bullet_json, action_json, model });
    },
    getSummaryBySessionId: (sessionId) => {
        return sqliteRepository.getSummaryBySessionId(sessionId);
    }
};

module.exports = summaryRepositoryAdapter; 