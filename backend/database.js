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
  // ===== ANIVERSARIOS =====
  async getAllAniversarios(filters = {}) {
    let query = 'SELECT * FROM aniversarios';
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (filters.buscar) {
      conditions.push(`(LOWER(nombre) LIKE $${paramIndex} OR LOWER(descripcion) LIKE $${paramIndex + 1})`);
      params.push(`%${filters.buscar.toLowerCase()}%`, `%${filters.buscar.toLowerCase()}%`);
      paramIndex += 2;
    }

    if (filters.anio) {
      conditions.push(`anio = $${paramIndex}`);
      params.push(parseInt(filters.anio));
      paramIndex++;
    }

    if (filters.estado !== undefined && filters.estado !== '') {
      conditions.push(`estado = $${paramIndex}`);
      params.push(parseInt(filters.estado));
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY anio DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getAniversarioById(id) {
    const result = await pool.query('SELECT * FROM aniversarios WHERE id = $1', [id]);
    return result.rows[0];
  },

  async getAniversarioByAnio(anio) {
    const result = await pool.query('SELECT * FROM aniversarios WHERE anio = $1', [anio]);
    return result.rows[0];
  },

  async createAniversario(data) {
    const result = await pool.query(
      `INSERT INTO aniversarios (nombre, anio, descripcion, estado) 
       VALUES ($1, $2, $3, 0) 
       RETURNING *`,
      [data.nombre, data.anio, data.descripcion || '']
    );
    return result.rows[0];
  },

  async updateAniversario(id, data) {
    const result = await pool.query(
      `UPDATE aniversarios 
       SET nombre = COALESCE($1, nombre), 
           anio = COALESCE($2, anio), 
           descripcion = COALESCE($3, descripcion), 
           estado = COALESCE($4, estado),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [data.nombre, data.anio, data.descripcion, data.estado, id]
    );
    return result.rows[0];
  },

  async deleteAniversario(id) {
    const result = await pool.query('DELETE FROM aniversarios WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  // ===== IMÁGENES DE ANIVERSARIOS =====
  async getImagenesByAniversarioId(aniversarioId) {
    const result = await pool.query(
      'SELECT * FROM imagenes_aniversario WHERE aniversario_id = $1 ORDER BY orden ASC',
      [aniversarioId]
    );
    return result.rows;
  },

  async getAllImagenes() {
    const result = await pool.query(`
      SELECT i.*, a.nombre as aniversario_nombre, a.anio
      FROM imagenes_aniversario i
      JOIN aniversarios a ON i.aniversario_id = a.id
      ORDER BY a.anio DESC, i.orden ASC
    `);
    return result.rows;
  },

  async createImagen(data) {
    const result = await pool.query(
      `INSERT INTO imagenes_aniversario (aniversario_id, url, orden, descripcion) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [data.aniversario_id, data.url, data.orden || 0, data.descripcion || '']
    );
    return result.rows[0];
  },

  async createImagenesBulk(aniversarioId, urls) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Eliminar imágenes existentes
      await client.query('DELETE FROM imagenes_aniversario WHERE aniversario_id = $1', [aniversarioId]);
      
      // Insertar nuevas imágenes
      const imagenes = [];
      for (let i = 0; i < urls.length; i++) {
        if (urls[i] && urls[i].trim()) {
          const result = await client.query(
            `INSERT INTO imagenes_aniversario (aniversario_id, url, orden) 
             VALUES ($1, $2, $3) RETURNING *`,
            [aniversarioId, urls[i].trim(), i]
          );
          imagenes.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      return imagenes;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateImagen(id, data) {
    const result = await pool.query(
      `UPDATE imagenes_aniversario 
       SET url = COALESCE($1, url), 
           orden = COALESCE($2, orden),
           descripcion = COALESCE($3, descripcion)
       WHERE id = $4 
       RETURNING *`,
      [data.url, data.orden, data.descripcion, id]
    );
    return result.rows[0];
  },

  async deleteImagen(id) {
    const result = await pool.query('DELETE FROM imagenes_aniversario WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  async deleteImagenesByAniversarioId(aniversarioId) {
    await pool.query('DELETE FROM imagenes_aniversario WHERE aniversario_id = $1', [aniversarioId]);
    return true;
  },

  // ===== EVENTOS =====
  async getAllEventos() {
    const result = await pool.query('SELECT * FROM eventos ORDER BY fecha_creacion DESC');
    return result.rows;
  },

  async createEvento(data) {
    const result = await pool.query(
      `INSERT INTO eventos (nombre, descripcion, anio, estado) 
       VALUES ($1, $2, $3, 0) 
       RETURNING *`,
      [data.nombre, data.descripcion || '', data.anio]
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
    const totalAniversarios = await pool.query('SELECT COUNT(*) as total FROM aniversarios');
    const totalEventos = await pool.query('SELECT COUNT(*) as total FROM eventos');
    const totalImagenes = await pool.query('SELECT COUNT(*) as total FROM imagenes_aniversario');

    const porAnio = await pool.query(
      'SELECT anio, COUNT(*) as cantidad FROM aniversarios GROUP BY anio ORDER BY anio DESC'
    );

    const porEstado = await pool.query(
      'SELECT estado, COUNT(*) as cantidad FROM aniversarios GROUP BY estado ORDER BY estado'
    );

    return {
      totalAniversarios: parseInt(totalAniversarios.rows[0].total),
      totalEventos: parseInt(totalEventos.rows[0].total),
      totalImagenes: parseInt(totalImagenes.rows[0].total),
      porAnio: porAnio.rows,
      porEstado: porEstado.rows.map(r => ({ estado: r.estado, cantidad: parseInt(r.cantidad) }))
    };
  },

  // ===== VALIDACIÓN =====
  async getRegistrosValidacion() {
    const aniversarios = await pool.query(`
      SELECT 
        'aniversario-' || id as id,
        nombre,
        anio::TEXT as anio,
        descripcion,
        estado,
        'aniversario' as tipo
      FROM aniversarios
      ORDER BY anio DESC
    `);

    const eventos = await pool.query(`
      SELECT 
        'evento-' || id as id,
        nombre,
        anio::TEXT as anio,
        descripcion,
        estado,
        'evento' as tipo
      FROM eventos
      ORDER BY anio DESC
    `);

    return [...aniversarios.rows, ...eventos.rows];
  },

  async updateEstadoRegistro(tipo, id, estado) {
    try {
      const tabla = tipo === 'aniversario' ? 'aniversarios' : 'eventos';
      // Extract numeric ID from composite ID (e.g., "aniversario-5" -> 5)
      const numericId = id.includes('-') ? id.split('-')[1] : id;
      
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

  // ===== ADMIN =====
  async vaciarBaseDeDatos() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET search_path TO aniversario, public');
      await client.query('TRUNCATE TABLE imagenes_aniversario RESTART IDENTITY CASCADE');
      await client.query('TRUNCATE TABLE aniversarios RESTART IDENTITY CASCADE');
      await client.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE');
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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
