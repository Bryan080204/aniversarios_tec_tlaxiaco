/**
 * Configuración de Multer para subida de archivos
 * Sistema de Aniversarios TEC Tlaxiaco
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio base para uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Crear directorios si no existen
const crearDirectorios = () => {
  const dirs = [
    UPLOADS_DIR,
    path.join(UPLOADS_DIR, 'aniversarios'),
    path.join(UPLOADS_DIR, 'temp')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

crearDirectorios();

// Tipos MIME permitidos
const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Extensiones permitidas
const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Tamaño máximo: 10MB
const TAMANO_MAXIMO = 10 * 1024 * 1024;

/**
 * Filtro de archivos - solo permite imágenes
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (TIPOS_PERMITIDOS.includes(mimeType) && EXTENSIONES_PERMITIDAS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Solo se aceptan: ${EXTENSIONES_PERMITIDAS.join(', ')}`), false);
  }
};

/**
 * Configuración de almacenamiento para imágenes de aniversarios
 */
const storageAniversarios = multer.diskStorage({
  destination: (req, file, cb) => {
    const anio = req.body.anio || req.params.anio || new Date().getFullYear();
    const uploadPath = path.join(UPLOADS_DIR, 'aniversarios', String(anio));
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4().slice(0, 8);
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const nombreLimpio = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(0, 50);
    
    cb(null, `${uniqueId}-${timestamp}${ext}`);
  }
});

/**
 * Middleware de multer para subir imágenes de aniversarios
 * Permite múltiples archivos (máximo 6)
 */
export const uploadAniversarios = multer({
  storage: storageAniversarios,
  fileFilter: fileFilter,
  limits: {
    fileSize: TAMANO_MAXIMO,
    files: 6 // Máximo 6 imágenes por aniversario
  }
});

/**
 * Almacenamiento en memoria para procesamiento
 */
const storageMemory = multer.memoryStorage();

export const uploadMemory = multer({
  storage: storageMemory,
  fileFilter: fileFilter,
  limits: {
    fileSize: TAMANO_MAXIMO,
    files: 6
  }
});

/**
 * Obtener la ruta pública de un archivo
 * @param {string} rutaCompleta - Ruta absoluta del archivo
 * @returns {string} Ruta relativa para acceso público
 */
export function obtenerRutaPublica(rutaCompleta) {
  return rutaCompleta.replace(UPLOADS_DIR, '/uploads').replace(/\\/g, '/');
}

/**
 * Eliminar archivo del sistema
 * @param {string} rutaArchivo - Ruta del archivo a eliminar
 */
export async function eliminarArchivo(rutaArchivo) {
  try {
    const rutaCompleta = rutaArchivo.startsWith('/uploads') 
      ? path.join(UPLOADS_DIR, rutaArchivo.replace('/uploads', ''))
      : rutaArchivo;
    
    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
}

/**
 * Obtener información de un archivo
 * @param {string} rutaArchivo 
 */
export function obtenerInfoArchivo(rutaArchivo) {
  try {
    const stats = fs.statSync(rutaArchivo);
    return {
      tamano: stats.size,
      creado: stats.birthtime,
      modificado: stats.mtime
    };
  } catch {
    return null;
  }
}

/**
 * Middleware para manejar errores de multer
 */
export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: `El archivo excede el tamaño máximo permitido (${TAMANO_MAXIMO / 1024 / 1024}MB)` 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Se excedió el número máximo de archivos permitidos (6)' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Campo de archivo no esperado' 
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
}

export default {
  uploadAniversarios,
  uploadMemory,
  obtenerRutaPublica,
  eliminarArchivo,
  obtenerInfoArchivo,
  handleMulterError,
  UPLOADS_DIR,
  TIPOS_PERMITIDOS,
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO
};
