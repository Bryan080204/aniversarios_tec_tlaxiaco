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
        const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('aniversario', 'public')");
        console.table(res.rows);

        // Si existe la tabla usuarios, ver contenido
        const hasUsers = res.rows.some(r => r.table_name === 'usuarios');
        if (hasUsers) {
            const users = await pool.query("SELECT id, username, rol FROM aniversario.usuarios");
            console.log('Usuarios:');
            console.table(users.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
