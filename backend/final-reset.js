import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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
        const rawPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(rawPassword, salt);

        console.log('Generated Hash:', hash);

        // Update DB
        await pool.query("UPDATE aniversario.usuarios SET password_hash = $1 WHERE username = 'admin'", [hash]);
        console.log('✅ DB Updated');

        // Verify from DB
        const res = await pool.query("SELECT password_hash FROM aniversario.usuarios WHERE username = 'admin'");
        const dbHash = res.rows[0].password_hash;
        console.log('DB Hash:', dbHash);

        const isMatch = await bcrypt.compare(rawPassword, dbHash);
        console.log('Match Verification:', isMatch);

        if (isMatch) {
            console.log('🚀 SUCCESS: Admin password is now admin123 and matches perfectly.');
        } else {
            console.error('❌ FAILURE: Verification failed.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
