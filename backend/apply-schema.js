import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const { Client } = pg;
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'basetec',
});

async function init() {
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        console.log('Connecting to database...');
        await client.connect();
        console.log('Executing schema.sql...');
        await client.query(schemaSql);
        console.log('✅ Database initialized successfully!');
        await client.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

init();
