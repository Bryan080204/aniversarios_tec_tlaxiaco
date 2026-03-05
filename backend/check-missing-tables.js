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
        const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name IN ('usuarios', 'log_validaciones')");
        console.log('Found tables:', res.rows);
        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();
