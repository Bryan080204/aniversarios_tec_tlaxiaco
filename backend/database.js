import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD ?? ''),
  database: process.env.DB_NAME || 'basetec',
});

// Verificar conexión
pool.on('connect', (client) => {
  console.log('✅ Conectado a PostgreSQL');
  client.query('SET search_path TO aniversario, public');
});

pool.on('error', (err) => {
  console.error('❌ Error en PostgreSQL:', err.message);
});

// ==================== FUNCIONES DE BASE DE DATOS ====================

export const database = {
  // ===== ALUMNOS =====
  async getAllAlumnos(filters = {}) {
    let query = 'SELECT * FROM alumnos';
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (filters.buscar) {
      conditions.push(`(LOWER(nombre) LIKE $${paramIndex} OR numero_control LIKE $${paramIndex + 1})`);
      params.push(`%${filters.buscar.toLowerCase()}%`, `%${filters.buscar}%`);
      paramIndex += 2;
    }

    if (filters.carrera) {
      conditions.push(`carrera = $${paramIndex}`);
      params.push(filters.carrera);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY fecha_registro DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getAlumnoById(id) {
    const result = await pool.query('SELECT * FROM alumnos WHERE id = $1', [id]);
    return result.rows[0];
  },

  async getAlumnoByControl(numero_control) {
    const result = await pool.query('SELECT * FROM alumnos WHERE numero_control = $1', [numero_control]);
    return result.rows[0];
  },

  async createAlumno(data) {
    const result = await pool.query(
      `INSERT INTO alumnos (nombre, numero_control, carrera, estado) 
       VALUES ($1, $2, $3, 0) 
       RETURNING *`,
      [data.nombre, data.numero_control, data.carrera]
    );
    return result.rows[0];
  },

  async updateAlumno(id, data) {
    const result = await pool.query(
      `UPDATE alumnos 
       SET nombre = COALESCE($1, nombre), 
           numero_control = COALESCE($2, numero_control), 
           carrera = COALESCE($3, carrera), 
           estado = COALESCE($4, estado)
       WHERE id = $5 
       RETURNING *`,
      [data.nombre, data.numero_control, data.carrera, data.estado, id]
    );
    return result.rows[0];
  },

  async deleteAlumno(id) {
    const result = await pool.query('DELETE FROM alumnos WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  // ===== EVENTOS =====
  async getAllEventos() {
    const result = await pool.query('SELECT * FROM eventos ORDER BY fecha_creacion DESC');
    return result.rows;
  },

  async createEvento(data) {
    const result = await pool.query(
      `INSERT INTO eventos (nombre, descripcion, año, estado) 
       VALUES ($1, $2, $3, 0) 
       RETURNING *`,
      [data.nombre, data.descripcion || '', data.año]
    );
    return result.rows[0];
  },

  async updateEventoEstado(id, estado) {
    const result = await pool.query(
      'UPDATE eventos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    return result.rows[0];
  },

  // ===== ESTADÍSTICAS =====
  async getEstadisticas() {
    const totalAlumnos = await pool.query('SELECT COUNT(*) as total FROM alumnos');
    const totalEventos = await pool.query('SELECT COUNT(*) as total FROM eventos');

    const porCarrera = await pool.query(
      'SELECT carrera, COUNT(*) as cantidad FROM alumnos GROUP BY carrera'
    );

    const porEstado = await pool.query(
      'SELECT estado, COUNT(*) as cantidad FROM alumnos GROUP BY estado'
    );

    return {
      totalAlumnos: parseInt(totalAlumnos.rows[0].total),
      totalEventos: parseInt(totalEventos.rows[0].total),
      porCarrera: porCarrera.rows,
      porEstado: porEstado.rows.map(r => ({ estado: r.estado, cantidad: parseInt(r.cantidad) }))
    };
  },

  // ===== VALIDACIÓN =====
  async getRegistrosValidacion() {
    const alumnos = await pool.query(`
      SELECT 
        'alumno-' || id as id,
        nombre,
        EXTRACT(YEAR FROM fecha_registro)::TEXT as año,
        carrera as descripcion,
        estado
      FROM alumnos
    `);

    const eventos = await pool.query(`
      SELECT 
        'evento-' || id as id,
        nombre,
        año::TEXT as año,
        descripcion,
        estado
      FROM eventos
    `);

    return [...alumnos.rows, ...eventos.rows];
  },

  async updateEstadoRegistro(tipo, id, estado) {
    try {
      const tabla = tipo === 'alumno' ? 'alumnos' : 'eventos';
      // Extract numeric ID from composite ID (e.g., "alumno-5" -> 5)
      const numericId = id.split('-')[1] || id;
      
      const result = await pool.query(
        `UPDATE ${tabla} SET estado = $1 WHERE id = $2 RETURNING *`,
        [estado, numericId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating status:', error);
      return null;
    }
  },

  // ===== UTILIDADES =====
  async testConnection() {
    try {
      await pool.query('SELECT NOW()');
      return true;
    } catch (error) {
      console.error('Error de conexión:', error.message);
      return false;
    }
  }
};

export default database;
