const sqliteRepository = require('./sqlite.repository');

const sttRepositoryAdapter = {
    addTranscript: ({ sessionId, speaker, text }) => {
        return sqliteRepository.addTranscript({ sessionId, speaker, text });
    },
    getAllTranscriptsBySessionId: (sessionId) => {
        return sqliteRepository.getAllTranscriptsBySessionId(sessionId);
    }
};

module.exports = sttRepositoryAdapter; 