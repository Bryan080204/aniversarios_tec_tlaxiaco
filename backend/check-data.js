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

async function check() {
    try {
        await client.connect();
        await client.query('SET search_path TO aniversario, public');
        const tables = ['aniversarios', 'imagenes_aniversario', 'eventos'];
        for (const table of tables) {
            const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`Table ${table} has ${res.rows[0].count} rows`);
        }
        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();
