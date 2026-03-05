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
        // Hasheamos 'admin123'
        const newHash = '$2b$10$C/H3p7zce/AXVofNItVP2KtBCICzNetYC7bH93mdmt';
        await pool.query("UPDATE aniversario.usuarios SET password_hash = $1 WHERE username = 'admin'", [newHash]);
        console.log('✅ Password de admin actualizado a "admin123"');
    } catch (e) {
        console.error('❌ Error al actualizar password:', e);
    } finally {
        await pool.end();
    }
}
run();
