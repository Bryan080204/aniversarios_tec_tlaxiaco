import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const { Client } = pg;

const createTablesQuery = `
  -- Forzar limpieza del esquema anterior para eliminar tablas obsoletas
  DROP SCHEMA IF EXISTS aniversario CASCADE;
  CREATE SCHEMA aniversario;
  SET search_path TO aniversario, public;

  -- Tabla de aniversarios
  CREATE TABLE aniversarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    anio INTEGER NOT NULL,
    descripcion TEXT,
    estado INTEGER DEFAULT 0 CHECK (estado IN (0, 1, 2)),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio)
  );

  -- Tabla de imágenes de aniversarios
  CREATE TABLE imagenes_aniversario (
    id SERIAL PRIMARY KEY,
    aniversario_id INTEGER NOT NULL REFERENCES aniversarios(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de eventos
  CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    anio INTEGER NOT NULL,
    estado INTEGER DEFAULT 0 CHECK (estado IN (0, 1, 2)),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Índices para mejorar rendimiento
  CREATE INDEX idx_aniversarios_anio ON aniversarios(anio);
  CREATE INDEX idx_aniversarios_estado ON aniversarios(estado);
  CREATE INDEX idx_imagenes_aniversario_id ON imagenes_aniversario(aniversario_id);
  CREATE INDEX idx_eventos_anio ON eventos(anio);
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
    console.log('Conectando a la base de datos...');
    await client.connect();

    console.log('Creando tablas...');
    await client.query(createTablesQuery);

    console.log('✅ Tablas creadas correctamente!');
    console.log(`
    Tablas creadas:
    - aniversarios (registros de aniversarios)
    - imagenes_aniversario (URLs de imágenes)
    - eventos (eventos especiales)
    `);
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
  } finally {
    await client.end();
  }
}

initDB();
