-- =====================================================
-- SCHEMA: Sistema de Aniversarios TEC Tlaxiaco
-- Base de datos: PostgreSQL
-- Versión: 2.0 - Con sistema de roles y subida de imágenes
-- =====================================================

-- Forzar limpieza del esquema anterior para eliminar tablas obsoletas (alumnos, etc.)
DROP SCHEMA IF EXISTS aniversario CASCADE;
CREATE SCHEMA aniversario;
SET search_path TO aniversario, public;

-- =====================================================
-- TABLA: usuarios
-- Almacena usuarios del sistema con roles
-- Roles: 'admin' = Administrador, 'usuario' = Usuario regular
-- =====================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    -- admin: Puede crear, editar, eliminar registros, validar, ver reportes, configuración
    -- usuario: Solo puede ver registros públicos y galería
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario administrador por defecto (password: admin123)
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) 
VALUES ('admin', '$2b$10$rIC/6mZ2J7qXwJ7uN2K8/.NE4WINzFhT8A2PqNzH8JOw0jtlQzO7G', 'Administrador', 'admin@tec-tlaxiaco.mx', 'admin');

-- Usuario regular por defecto (password: usuario123)
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) 
VALUES ('usuario', '$2b$10$K4dPxDHfQnH2KtBqLsV5qOEqVzPqL1P8rJQz2h5k.6T2ePbO8bYzu', 'Usuario Demo', 'usuario@tec-tlaxiaco.mx', 'usuario');

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
    creado_por INTEGER REFERENCES usuarios(id),
    validado_por INTEGER REFERENCES usuarios(id),
    fecha_validacion TIMESTAMP,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio)
);

-- =====================================================
-- TABLA: imagenes_aniversario
-- Almacena las imágenes subidas asociadas a cada aniversario
-- Ahora almacena archivos en lugar de URLs
-- =====================================================
CREATE TABLE imagenes_aniversario (
    id SERIAL PRIMARY KEY,
    aniversario_id INTEGER NOT NULL REFERENCES aniversarios(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255),
    ruta_archivo TEXT NOT NULL,
    tipo_mime VARCHAR(100),
    tamano_bytes INTEGER,
    orden INTEGER DEFAULT 0,
    descripcion VARCHAR(255),
    subido_por INTEGER REFERENCES usuarios(id),
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
    creado_por INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: sesiones
-- Almacena sesiones activas de usuarios
-- =====================================================
CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expira_en TIMESTAMP NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: log_validaciones
-- Historial de validaciones realizadas
-- =====================================================
CREATE TABLE log_validaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'aniversario' o 'evento'
    registro_id INTEGER NOT NULL,
    estado_anterior INTEGER,
    estado_nuevo INTEGER NOT NULL,
    validado_por INTEGER REFERENCES usuarios(id),
    comentario TEXT,
    fecha_validacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES para mejorar rendimiento
-- =====================================================
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_aniversarios_anio ON aniversarios(anio);
CREATE INDEX idx_aniversarios_estado ON aniversarios(estado);
CREATE INDEX idx_imagenes_aniversario_id ON imagenes_aniversario(aniversario_id);
CREATE INDEX idx_eventos_anio ON eventos(anio);
CREATE INDEX idx_sesiones_token ON sesiones(token);
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX idx_log_validaciones_tipo ON log_validaciones(tipo, registro_id);

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

-- Trigger para usuarios
CREATE TRIGGER trigger_actualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- FUNCIÓN: Limpiar sesiones expiradas
-- =====================================================
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS void AS $$
BEGIN
    DELETE FROM sesiones WHERE expira_en < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
