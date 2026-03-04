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

// ==================== RUTAS DE ALUMNOS ====================

// Obtener todos los alumnos
app.get('/api/alumnos', async (req, res) => {
  try {
    const { buscar, carrera } = req.query;
    const alumnos = await database.getAllAlumnos({ buscar, carrera });
    res.json(alumnos);
  } catch (error) {
    console.error('Error in GET /api/alumnos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un alumno por ID
app.get('/api/alumnos/:id', async (req, res) => {
  try {
    const alumno = await database.getAlumnoById(req.params.id);
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json(alumno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo alumno
app.post('/api/alumnos', async (req, res) => {
  try {
    const { nombre, numero_control, carrera } = req.body;

    if (!nombre || !numero_control || !carrera) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el número de control ya existe
    const existe = await database.getAlumnoByControl(numero_control);
    if (existe) {
      return res.status(400).json({ error: 'El número de control ya está registrado' });
    }

    const nuevoAlumno = await database.createAlumno({ nombre, numero_control, carrera });
    res.status(201).json(nuevoAlumno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar alumno
app.put('/api/alumnos/:id', async (req, res) => {
  try {
    const { nombre, numero_control, carrera, estado } = req.body;
    const { id } = req.params;

    const alumno = await database.getAlumnoById(id);
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const actualizado = await database.updateAlumno(id, {
      nombre: nombre || alumno.nombre,
      numero_control: numero_control || alumno.numero_control,
      carrera: carrera || alumno.carrera,
      estado: estado !== undefined ? estado : alumno.estado
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar alumno
app.delete('/api/alumnos/:id', async (req, res) => {
  try {
    const deleted = await database.deleteAlumno(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json({ message: 'Alumno eliminado correctamente' });
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
    const { nombre, descripcion, año } = req.body;

    if (!nombre || !año) {
      return res.status(400).json({ error: 'Nombre y año son obligatorios' });
    }

    const nuevoEvento = await database.createEvento({ nombre, descripcion, año });
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

    res.json({ message: 'Estado actualizado correctamente' });
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
