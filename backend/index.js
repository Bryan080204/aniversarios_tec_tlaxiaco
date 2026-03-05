/**
 * =======================================================
 * API Sistema de Aniversarios - TEC Tlaxiaco
 * =======================================================
 * Backend Node.js con Express
 * Documentación disponible en /api/docs
 * 
 * ENDPOINTS PRINCIPALES:
 * - /api/auth/*         - Autenticación y sesiones
 * - /api/usuarios/*     - Gestión de usuarios (admin)
 * - /api/aniversarios/* - CRUD de aniversarios
 * - /api/imagenes/*     - Gestión de imágenes
 * - /api/validacion/*   - Validación de registros
 * - /api/estadisticas   - Reportes y métricas
 * =======================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import { database } from './database.js';
import { swaggerSpec } from './config/swagger.js';
import { verificarToken, tokenOpcional, soloAdmin, generarToken } from './middleware/auth.js';
import { uploadAniversarios, obtenerRutaPublica, eliminarArchivo, handleMulterError } from './config/multer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== DOCUMENTACIÓN SWAGGER ====================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Aniversarios TEC - Documentación'
}));

app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ==================== RUTAS DE AUTENTICACIÓN ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const usuario = await database.verificarCredenciales(username, password);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);

    res.json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/auth/me', verificarToken, async (req, res) => {
  try {
    const usuario = await database.getUsuarioById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', verificarToken, (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente' });
});

// ==================== RUTAS DE USUARIOS (SOLO ADMIN) ====================

app.get('/api/usuarios', verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuarios = await database.getAllUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { username, password, nombre_completo, email, rol } = req.body;

    if (!username || !password || !nombre_completo) {
      return res.status(400).json({ error: 'Username, password y nombre completo son requeridos' });
    }

    const existente = await database.getUsuarioByUsername(username);
    if (existente) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const usuario = await database.createUsuario({
      username,
      password,
      nombre_completo,
      email,
      rol: rol || 'usuario'
    });

    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuario = await database.updateUsuario(req.params.id, req.body);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/usuarios/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.usuario.id) {
      return res.status(400).json({ error: 'No puede eliminar su propio usuario' });
    }

    const deleted = await database.deleteUsuario(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE ANIVERSARIOS ====================

// Obtener todos los aniversarios
app.get('/api/aniversarios', tokenOpcional, async (req, res) => {
  try {
    const { buscar, anio, estado } = req.query;
    let filtros = { buscar, anio, estado };

    // Si es usuario regular (no admin), solo mostrar validados
    if (!req.usuario || req.usuario.rol !== 'admin') {
      filtros.estado = 2;
    }

    const aniversarios = await database.getAllAniversarios(filtros);
    res.json(aniversarios);
  } catch (error) {
    console.error('Error in GET /api/aniversarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un aniversario por ID
app.get('/api/aniversarios/:id', async (req, res) => {
  try {
    const aniversario = await database.getAniversarioById(req.params.id);
    if (!aniversario) {
      return res.status(404).json({ error: 'Aniversario no encontrado' });
    }
    res.json(aniversario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un aniversario por año
app.get('/api/aniversarios/anio/:anio', async (req, res) => {
  try {
    const aniversario = await database.getAniversarioByAnio(req.params.anio);
    if (!aniversario) {
      return res.status(404).json({ error: 'Aniversario no encontrado' });
    }
    res.json(aniversario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo aniversario (Cualquier usuario logueado puede registrar)
app.post('/api/aniversarios', verificarToken, async (req, res) => {
  try {
    const { nombre, anio, descripcion } = req.body;

    if (!anio) {
      return res.status(400).json({ error: 'El año es obligatorio' });
    }

    // Verificar si el año ya existe
    const existe = await database.getAniversarioByAnio(anio);
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un registro para ese año' });
    }

    const nombreGenerado = nombre || `Aniversario ${anio}`;
    const nuevoAniversario = await database.createAniversario({
      nombre: nombreGenerado,
      anio,
      descripcion
    });

    res.status(201).json(nuevoAniversario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar aniversario
app.put('/api/aniversarios/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, anio, descripcion, estado } = req.body;
    const { id } = req.params;

    const aniversario = await database.getAniversarioById(id);
    if (!aniversario) {
      return res.status(404).json({ error: 'Aniversario no encontrado' });
    }

    const actualizado = await database.updateAniversario(id, {
      nombre: nombre || aniversario.nombre,
      anio: anio || aniversario.anio,
      descripcion: descripcion !== undefined ? descripcion : aniversario.descripcion,
      estado: estado !== undefined ? estado : aniversario.estado
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar aniversario
app.delete('/api/aniversarios/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    // Primero eliminar imágenes asociadas (archivos)
    const imagenes = await database.deleteImagenesByAniversarioId(req.params.id);
    for (const img of imagenes) {
      if (img.ruta_archivo) {
        await eliminarArchivo(img.ruta_archivo);
      }
    }

    const deleted = await database.deleteAniversario(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Aniversario no encontrado' });
    }
    res.json({ message: 'Aniversario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE IMÁGENES ====================

// Obtener todas las imágenes
app.get('/api/imagenes', async (req, res) => {
  try {
    const imagenes = await database.getAllImagenes();
    res.json(imagenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener imágenes de un aniversario
app.get('/api/aniversarios/:id/imagenes', async (req, res) => {
  try {
    const imagenes = await database.getImagenesByAniversarioId(req.params.id);
    res.json(imagenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subir imágenes a un aniversario (archivos)
app.post('/api/aniversarios/:id/imagenes',
  verificarToken,
  uploadAniversarios.array('imagenes', 6),
  handleMulterError,
  async (req, res) => {
    try {
      const { id } = req.params;

      const aniversario = await database.getAniversarioById(id);
      if (!aniversario) {
        // Eliminar archivos ya subidos
        if (req.files) {
          for (const file of req.files) {
            await eliminarArchivo(file.path);
          }
        }
        return res.status(404).json({ error: 'Aniversario no encontrado' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se recibieron archivos' });
      }

      // Preparar datos de las imágenes
      const archivos = req.files.map(file => ({
        nombre_archivo: file.filename,
        nombre_original: file.originalname,
        ruta_archivo: obtenerRutaPublica(file.path),
        tipo_mime: file.mimetype,
        tamano_bytes: file.size
      }));

      const imagenes = await database.createImagenesBulk(id, archivos, req.usuario.id);

      res.status(201).json({
        message: `${imagenes.length} imagen(es) subida(s) correctamente`,
        imagenes
      });
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Actualizar múltiples imágenes de un aniversario (legacy - para URLs)
app.put('/api/aniversarios/:id/imagenes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { urls } = req.body;
    const { id } = req.params;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Se requiere un array de URLs' });
    }

    const aniversario = await database.getAniversarioById(id);
    if (!aniversario) {
      return res.status(404).json({ error: 'Aniversario no encontrado' });
    }

    // Para compatibilidad, convertimos URLs a formato de archivo
    const archivos = urls.filter(url => url && url.trim()).map((url, index) => ({
      nombre_archivo: `url-${Date.now()}-${index}`,
      nombre_original: url,
      ruta_archivo: url.trim(),
      tipo_mime: 'image/external',
      tamano_bytes: 0
    }));

    const imagenes = await database.createImagenesBulk(id, archivos);
    res.json(imagenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar una imagen específica
app.put('/api/imagenes/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { orden, descripcion } = req.body;
    const imagen = await database.updateImagen(req.params.id, { orden, descripcion });
    if (!imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    res.json(imagen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una imagen
app.delete('/api/imagenes/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const imagen = await database.deleteImagen(req.params.id);
    if (!imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    // Eliminar archivo físico si no es una URL externa
    if (imagen.ruta_archivo && imagen.ruta_archivo.startsWith('/uploads')) {
      await eliminarArchivo(imagen.ruta_archivo);
    }

    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE EVENTOS ====================

// Obtener todos los eventos
app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await database.getAllEventos();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear evento
app.post('/api/eventos', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, anio } = req.body;

    if (!nombre || !anio) {
      return res.status(400).json({ error: 'Nombre y año son obligatorios' });
    }

    const nuevoEvento = await database.createEvento({ nombre, descripcion, anio });
    res.status(201).json(nuevoEvento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de evento
app.put('/api/eventos/:id/estado', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    const { id } = req.params;

    const evento = await database.updateEventoEstado(id, estado);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(evento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE VALIDACIÓN ====================

// Obtener registros para validación
app.get('/api/validacion/registros', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { estado } = req.query;
    const registros = await database.getRegistrosValidacion({ estado });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener solo registros pendientes
app.get('/api/validacion/pendientes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const registros = await database.getRegistrosPendientes();
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar un registro con historial
app.put('/api/validacion/:tipo/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { estado, comentario } = req.body;

    if (estado === undefined) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }

    const resultado = await database.validarRegistro(tipo, id, estado, req.usuario.id, comentario);

    res.json({
      message: 'Registro validado correctamente',
      data: resultado
    });
  } catch (error) {
    if (error.message === 'Registro no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de registro (legacy)
app.put('/api/validacion/:tipo/:id/estado', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { estado } = req.body;

    const resultado = await database.updateEstadoRegistro(tipo, id, estado);
    if (!resultado) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Estado actualizado correctamente', data: resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de validaciones
app.get('/api/validacion/historial', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { tipo, registro_id } = req.query;
    const historial = await database.getHistorialValidaciones(tipo, registro_id);
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ESTADÍSTICAS ====================

app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await database.getEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /api/estadisticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== VALIDACIÓN ====================

app.get('/api/validacion/registros', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { estado } = req.query;
    const registros = await database.getRegistrosValidacion({ estado });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener registros pendientes de validación
app.get('/api/validacion/pendientes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const registros = await database.getRegistrosPendientes();
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar un registro con historial
app.put('/api/validacion/:tipo/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { estado, comentario } = req.body;

    if (estado === undefined) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }

    const resultado = await database.validarRegistro(tipo, id, estado, req.usuario.id, comentario);

    res.json({
      message: 'Registro validado correctamente',
      data: resultado
    });
  } catch (error) {
    if (error.message === 'Registro no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de registro (legacy)
app.put('/api/validacion/:tipo/:id/estado', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { estado } = req.body;

    const resultado = await database.updateEstadoRegistro(tipo, id, estado);
    if (!resultado) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Estado actualizado correctamente', data: resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de validaciones
app.get('/api/validacion/historial', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { tipo, registro_id } = req.query;
    const historial = await database.getHistorialValidaciones(tipo, registro_id);
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMINISTRACIÓN ====================

// Vaciar base de datos (requiere confirmación)
app.delete('/api/admin/vaciar', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { confirmacion } = req.body;

    if (confirmacion !== 'CONFIRMAR_VACIAR_BD') {
      return res.status(400).json({
        error: 'Debe enviar confirmacion: "CONFIRMAR_VACIAR_BD" para vaciar la base de datos'
      });
    }

    await database.vaciarBaseDeDatos();
    res.json({ message: 'Base de datos vaciada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', async (req, res) => {
  const dbConnected = await database.testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ==================== MANEJO DE ERRORES ====================

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, async () => {
  const dbConnected = await database.testConnection();
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║   🎓 TEC Tlaxiaco - Backend API v2.0                       ║
  ║   Servidor corriendo en http://localhost:${PORT}               ║
  ║   Documentación: http://localhost:${PORT}/api/docs             ║
  ║   Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}                        ║
  ╠════════════════════════════════════════════════════════════╣
  ║   ROLES:                                                   ║
  ║   • admin    - Acceso completo (usuario: admin)            ║
  ║   • usuario  - Solo lectura de validados                   ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
