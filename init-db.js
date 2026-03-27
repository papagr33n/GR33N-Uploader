require('dotenv').config();
const { createPool } = require('@vercel/postgres');

async function initDb() {
    const pool = createPool({
        connectionString: process.env.POSTGRES_URL
    });
    
    try {
        console.log('Connecting to database...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS images (
                id VARCHAR(10) PRIMARY KEY,
                filename TEXT NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "images" initialized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await pool.end();
    }
}

initDb();
