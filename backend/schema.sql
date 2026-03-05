-- =====================================================
-- SCHEMA: Sistema de Aniversarios TEC Tlaxiaco
-- Base de datos: PostgreSQL
-- =====================================================

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS aniversario;
SET search_path TO aniversario, public;

-- =====================================================
-- TABLA: aniversarios
-- Almacena los registros de aniversarios institucionales
-- =====================================================
CREATE TABLE IF NOT EXISTS aniversarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    anio INTEGER NOT NULL,
    descripcion TEXT,
    estado INTEGER DEFAULT 0 CHECK (estado IN (0, 1, 2)),
    -- 0 = Sin Validar, 1 = En Proceso, 2 = Validado
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio)
);

-- =====================================================
-- TABLA: imagenes_aniversario
-- Almacena las URLs de imágenes asociadas a cada aniversario
-- =====================================================
CREATE TABLE IF NOT EXISTS imagenes_aniversario (
    id SERIAL PRIMARY KEY,
    aniversario_id INTEGER NOT NULL REFERENCES aniversarios(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: eventos
-- Almacena eventos especiales del TEC
-- =====================================================
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    anio INTEGER NOT NULL,
    estado INTEGER DEFAULT 0 CHECK (estado IN (0, 1, 2)),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES para mejorar rendimiento
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_aniversarios_anio ON aniversarios(anio);
CREATE INDEX IF NOT EXISTS idx_aniversarios_estado ON aniversarios(estado);
CREATE INDEX IF NOT EXISTS idx_imagenes_aniversario_id ON imagenes_aniversario(aniversario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_anio ON eventos(anio);

-- =====================================================
-- FUNCIÓN: Actualizar fecha_actualizacion automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aniversarios
DROP TRIGGER IF EXISTS trigger_actualizar_aniversarios ON aniversarios;
CREATE TRIGGER trigger_actualizar_aniversarios
    BEFORE UPDATE ON aniversarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- DATOS DE EJEMPLO (opcional)
-- =====================================================
-- INSERT INTO aniversarios (nombre, anio, descripcion, estado) VALUES
--     ('Aniversario 2024', 2024, 'Celebración del aniversario institucional', 2),
--     ('Aniversario 2025', 2025, 'Feria tecnológica y actividades académicas', 1),
--     ('Aniversario 2026', 2026, 'Evento cultural y deportivo', 0);
