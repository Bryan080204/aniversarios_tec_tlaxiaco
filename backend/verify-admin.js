import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function run() {
    try {
        const res = await pool.query("SELECT id, username, password_hash, rol FROM aniversario.usuarios WHERE username = 'admin'");
        console.log('Admin User Info:');
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
