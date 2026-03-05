import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'basetec',
});

async function test() {
    try {
        await client.connect();
        console.log('SUCCESS: Connected to database');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('Info:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('FAILURE:', err.message);
        process.exit(1);
    }
}

test();
