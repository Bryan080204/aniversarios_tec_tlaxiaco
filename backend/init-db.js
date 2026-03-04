import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const { Client } = pg;

const createTablesQuery = `
  CREATE SCHEMA IF NOT EXISTS aniversario;
  SET search_path TO aniversario;

  CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    numero_control VARCHAR(50) UNIQUE NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    estado INTEGER DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    año INTEGER NOT NULL,
    estado INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function initDB() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'basetec',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Creating tables...');
    await client.query(createTablesQuery);

    console.log('✅ Tables created successfully!');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  } finally {
    await client.end();
  }
}

initDB();
