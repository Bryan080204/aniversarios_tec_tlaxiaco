-- =====================================================
-- SCHEMA: Sistema de Aniversarios TEC Tlaxiaco
-- Base de datos: PostgreSQL
-- =====================================================

-- Forzar limpieza del esquema anterior para eliminar tablas obsoletas (alumnos, etc.)
DROP SCHEMA IF EXISTS aniversario CASCADE;
CREATE SCHEMA aniversario;
SET search_path TO aniversario, public;

-- =====================================================
-- TABLA: aniversarios
-- Almacena los registros de aniversarios institucionales
-- =====================================================
CREATE TABLE aniversarios (
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
CREATE TABLE imagenes_aniversario (
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
CREATE TABLE eventos (
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
CREATE INDEX idx_aniversarios_anio ON aniversarios(anio);
CREATE INDEX idx_aniversarios_estado ON aniversarios(estado);
CREATE INDEX idx_imagenes_aniversario_id ON imagenes_aniversario(aniversario_id);
CREATE INDEX idx_eventos_anio ON eventos(anio);

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
CREATE TRIGGER trigger_actualizar_aniversarios
    BEFORE UPDATE ON aniversarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();
