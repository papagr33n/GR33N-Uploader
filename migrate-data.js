require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPool } = require('@vercel/postgres');

async function migrateData() {
    const linksFile = path.join(__dirname, 'links.json');
    if (!fs.existsSync(linksFile)) {
        console.log('No links.json found, skipping migration.');
        return;
    }

    const pool = createPool({
        connectionString: process.env.POSTGRES_URL
    });

    try {
        const data = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
        console.log(`Migrating ${Object.keys(data).length} links...`);

        for (const [id, filename] of Object.entries(data)) {
            await pool.query(
                'INSERT INTO images (id, filename) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
                [id, filename]
            );
            console.log(`Migrated: ${id} -> ${filename}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await pool.end();
    }
}

migrateData();
