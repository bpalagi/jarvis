const sqliteClient = require('../../services/sqliteClient');

function getPersonalizePrompt() {
    const db = sqliteClient.getDb();
    const query = `
        SELECT * FROM personalize
        LIMIT 1
    `;
    
    try {
        return db.prepare(query).get();
    } catch (err) {
        console.error('SQLite: Failed to get personalize prompt:', err);
        throw err;
    }
}

function updatePersonalizePrompt({ prompt }) {
    const db = sqliteClient.getDb();
    const query = `UPDATE personalize SET prompt = ? WHERE id = 'default'`;

    try {
        const result = db.prepare(query).run(prompt);
        if (result.changes === 0) {
            throw new Error("Personalize prompt not found.");
        }
        return { changes: result.changes };
    } catch (err) {
        throw err;
    }
}

module.exports = {
    getPersonalizePrompt,
    updatePersonalizePrompt
};