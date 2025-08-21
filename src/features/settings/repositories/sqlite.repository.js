const sqliteClient = require('../../common/services/sqliteClient');

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

function getAutoUpdate(uid) {
    const db = sqliteClient.getDb();
    const targetUid = uid;

    try {
        const row = db.prepare('SELECT auto_update_enabled FROM users WHERE uid = ?').get(targetUid);
        
        if (row) {
            console.log('SQLite: Auto update setting found:', row.auto_update_enabled);
            return row.auto_update_enabled !== 0;
        } else {
            // User doesn't exist, create them with default settings
            const now = Math.floor(Date.now() / 1000);
            const stmt = db.prepare(
                'INSERT OR REPLACE INTO users (uid, display_name, email, created_at, auto_update_enabled) VALUES (?, ?, ?, ?, ?)');
            stmt.run(targetUid, 'User', 'user@example.com', now, 1);
            return true; // default to enabled
        }
    } catch (error) {
        console.error('SQLite: Error getting auto_update_enabled setting:', error);
        return true; // fallback to enabled
    }
}

function setAutoUpdate(uid, isEnabled) {
    const db = sqliteClient.getDb();
    const targetUid = uid || sqliteClient.defaultUserId;
    
    try {
        const result = db.prepare('UPDATE users SET auto_update_enabled = ? WHERE uid = ?').run(isEnabled ? 1 : 0, targetUid);
        
        // If no rows were updated, the user might not exist, so create them
        if (result.changes === 0) {
            const now = Math.floor(Date.now() / 1000);
            const stmt = db.prepare('INSERT OR REPLACE INTO users (uid, display_name, email, created_at, auto_update_enabled) VALUES (?, ?, ?, ?, ?)');
            stmt.run(targetUid, 'User', 'user@example.com', now, isEnabled ? 1 : 0);
        }
        
        return { success: true };
    } catch (error) {
        console.error('SQLite: Error setting auto-update:', error);
        throw error;
    }
}

module.exports = {
    getPersonalizePrompt,
    updatePersonalizePrompt,
    getAutoUpdate,
    setAutoUpdate
};