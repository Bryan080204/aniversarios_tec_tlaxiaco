import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { database } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== RUTAS DE ANIVERSARIOS ====================

// Obtener todos los aniversarios
app.get('/api/aniversarios', async (req, res) => {
  try {
    const { buscar, anio, estado } = req.query;
    const aniversarios = await database.getAllAniversarios({ buscar, anio, estado });
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

// Crear nuevo aniversario
app.post('/api/aniversarios', async (req, res) => {
  try {
    const { nombre, anio, descripcion, imagenes } = req.body;

    if (!nombre || !anio) {
      return res.status(400).json({ error: 'Nombre y año son obligatorios' });
    }

    // Verificar si el año ya existe
    const existe = await database.getAniversarioByAnio(anio);
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un registro para ese año' });
    }

    const nuevoAniversario = await database.createAniversario({ nombre, anio, descripcion });
    
    // Si se enviaron imágenes, guardarlas
    if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
      await database.createImagenesBulk(nuevoAniversario.id, imagenes);
    }

    res.status(201).json(nuevoAniversario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar aniversario
app.put('/api/aniversarios/:id', async (req, res) => {
  try {
    const { nombre, anio, descripcion, estado, imagenes } = req.body;
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

    // Si se enviaron imágenes, actualizarlas
    if (imagenes && Array.isArray(imagenes)) {
      await database.createImagenesBulk(id, imagenes);
    }

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar aniversario
app.delete('/api/aniversarios/:id', async (req, res) => {
  try {
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

// Agregar imagen a un aniversario
app.post('/api/aniversarios/:id/imagenes', async (req, res) => {
  try {
    const { url, orden, descripcion } = req.body;
    const { id } = req.params;

    if (!url) {
      return res.status(400).json({ error: 'La URL de la imagen es obligatoria' });
    }

    const aniversario = await database.getAniversarioById(id);
    if (!aniversario) {
      return res.status(404).json({ error: 'Aniversario no encontrado' });
    }

    const imagen = await database.createImagen({
      aniversario_id: id,
      url,
      orden,
      descripcion
    });

    res.status(201).json(imagen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar múltiples imágenes de un aniversario
app.put('/api/aniversarios/:id/imagenes', async (req, res) => {
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

    const imagenes = await database.createImagenesBulk(id, urls);
    res.json(imagenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar una imagen específica
app.put('/api/imagenes/:id', async (req, res) => {
  try {
    const { url, orden, descripcion } = req.body;
    const imagen = await database.updateImagen(req.params.id, { url, orden, descripcion });
    if (!imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    res.json(imagen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una imagen
app.delete('/api/imagenes/:id', async (req, res) => {
  try {
    const deleted = await database.deleteImagen(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
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
app.post('/api/eventos', async (req, res) => {
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
app.put('/api/eventos/:id/estado', async (req, res) => {
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

app.get('/api/validacion/registros', async (req, res) => {
  try {
    const registros = await database.getRegistrosValidacion();
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de registro
app.put('/api/validacion/:tipo/:id/estado', async (req, res) => {
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

// ==================== ADMINISTRACIÓN ====================

// Vaciar base de datos (requiere confirmación)
app.delete('/api/admin/vaciar', async (req, res) => {
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
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  const dbConnected = await database.testConnection();
  console.log(`
  ╔════════════════════════════════════════════════════╗
  ║   🎓 TEC Tlaxiaco - Backend API                   ║
  ║   Servidor corriendo en http://localhost:${PORT}      ║
  ║   Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}              ║
  ╚════════════════════════════════════════════════════╝
  `);
});
