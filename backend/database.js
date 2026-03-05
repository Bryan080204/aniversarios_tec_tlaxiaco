import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

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
  // ============================================================
  // USUARIOS Y AUTENTICACIÓN
  // ============================================================
  
  /**
   * Obtener usuario por username
   */
  async getUsuarioByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
      [username]
    );
    return result.rows[0];
  },

  /**
   * Obtener usuario por ID
   */
  async getUsuarioById(id) {
    const result = await pool.query(
      'SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, fecha_creacion FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Obtener todos los usuarios (sin passwords)
   */
  async getAllUsuarios() {
    const result = await pool.query(
      'SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC'
    );
    return result.rows;
  },

  /**
   * Crear nuevo usuario
   */
  async createUsuario(data) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING id, username, nombre_completo, email, rol, activo, fecha_creacion`,
      [data.username, passwordHash, data.nombre_completo, data.email || null, data.rol || 'usuario']
    );
    return result.rows[0];
  },

  /**
   * Actualizar usuario
   */
  async updateUsuario(id, data) {
    let query = 'UPDATE usuarios SET ';
    const params = [];
    const updates = [];
    let paramIndex = 1;

    if (data.nombre_completo) {
      updates.push(`nombre_completo = $${paramIndex++}`);
      params.push(data.nombre_completo);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(data.email);
    }
    if (data.rol) {
      updates.push(`rol = $${paramIndex++}`);
      params.push(data.rol);
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${paramIndex++}`);
      params.push(data.activo);
    }
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(passwordHash);
    }

    if (updates.length === 0) return null;

    query += updates.join(', ') + ` WHERE id = $${paramIndex} RETURNING id, username, nombre_completo, email, rol, activo`;
    params.push(id);

    const result = await pool.query(query, params);
    return result.rows[0];
  },

  /**
   * Eliminar usuario
   */
  async deleteUsuario(id) {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  /**
   * Verificar credenciales de usuario
   */
  async verificarCredenciales(username, password) {
    const usuario = await this.getUsuarioByUsername(username);
    if (!usuario) return null;

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) return null;

    // Actualizar último acceso
    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [usuario.id]
    );

    return {
      id: usuario.id,
      username: usuario.username,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      rol: usuario.rol
    };
  },

  // ============================================================
  // ANIVERSARIOS
  // ============================================================
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

  /**
   * Crear imagen desde archivo subido
   */
  async createImagen(data) {
    const result = await pool.query(
      `INSERT INTO imagenes_aniversario 
       (aniversario_id, nombre_archivo, nombre_original, ruta_archivo, tipo_mime, tamano_bytes, orden, descripcion, subido_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        data.aniversario_id, 
        data.nombre_archivo, 
        data.nombre_original || data.nombre_archivo,
        data.ruta_archivo, 
        data.tipo_mime || 'image/jpeg',
        data.tamano_bytes || 0,
        data.orden || 0, 
        data.descripcion || '',
        data.subido_por || null
      ]
    );
    return result.rows[0];
  },

  /**
   * Crear múltiples imágenes desde archivos subidos
   */
  async createImagenesBulk(aniversarioId, archivos, usuarioId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const imagenes = [];
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const result = await client.query(
          `INSERT INTO imagenes_aniversario 
           (aniversario_id, nombre_archivo, nombre_original, ruta_archivo, tipo_mime, tamano_bytes, orden, subido_por) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            aniversarioId, 
            archivo.nombre_archivo,
            archivo.nombre_original,
            archivo.ruta_archivo, 
            archivo.tipo_mime,
            archivo.tamano_bytes,
            i,
            usuarioId
          ]
        );
        imagenes.push(result.rows[0]);
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

  /**
   * Obtener imagen por ID
   */
  async getImagenById(id) {
    const result = await pool.query('SELECT * FROM imagenes_aniversario WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updateImagen(id, data) {
    const result = await pool.query(
      `UPDATE imagenes_aniversario 
       SET orden = COALESCE($1, orden),
           descripcion = COALESCE($2, descripcion)
       WHERE id = $3 
       RETURNING *`,
      [data.orden, data.descripcion, id]
    );
    return result.rows[0];
  },

  async deleteImagen(id) {
    // Primero obtenemos la imagen para poder eliminar el archivo
    const imagen = await pool.query('SELECT * FROM imagenes_aniversario WHERE id = $1', [id]);
    const result = await pool.query('DELETE FROM imagenes_aniversario WHERE id = $1 RETURNING *', [id]);
    return result.rows[0]; // Retornamos la imagen eliminada para poder borrar el archivo
  },

  async deleteImagenesByAniversarioId(aniversarioId) {
    // Obtenemos las imágenes antes de eliminarlas
    const imagenes = await pool.query('SELECT * FROM imagenes_aniversario WHERE aniversario_id = $1', [aniversarioId]);
    await pool.query('DELETE FROM imagenes_aniversario WHERE aniversario_id = $1', [aniversarioId]);
    return imagenes.rows; // Retornamos para poder eliminar los archivos
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
    const totalUsuarios = await pool.query('SELECT COUNT(*) as total FROM usuarios WHERE activo = true');

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
      totalUsuarios: parseInt(totalUsuarios.rows[0].total),
      porAnio: porAnio.rows,
      porEstado: porEstado.rows.map(r => ({ estado: r.estado, cantidad: parseInt(r.cantidad) }))
    };
  },

  // ===== VALIDACIÓN =====
  async getRegistrosValidacion(filtros = {}) {
    let query = `
      SELECT 
        'aniversario-' || id as id,
        id as original_id,
        nombre,
        anio::TEXT as anio,
        descripcion,
        estado,
        'aniversario' as tipo,
        fecha_registro,
        fecha_actualizacion
      FROM aniversarios
    `;
    
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined && filtros.estado !== '') {
      conditions.push(`estado = $${paramIndex}`);
      params.push(parseInt(filtros.estado));
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY fecha_registro DESC';

    const aniversarios = await pool.query(query, params);

    // También obtener eventos con los mismos filtros
    let queryEventos = `
      SELECT 
        'evento-' || id as id,
        id as original_id,
        nombre,
        anio::TEXT as anio,
        descripcion,
        estado,
        'evento' as tipo,
        fecha_creacion as fecha_registro,
        fecha_creacion as fecha_actualizacion
      FROM eventos
    `;

    if (conditions.length > 0) {
      queryEventos += ' WHERE ' + conditions.join(' AND ').replace('fecha_registro', 'fecha_creacion');
    }
    
    queryEventos += ' ORDER BY fecha_creacion DESC';

    const eventos = await pool.query(queryEventos, params);

    return [...aniversarios.rows, ...eventos.rows];
  },

  /**
   * Obtener registros pendientes de validación
   */
  async getRegistrosPendientes() {
    const aniversarios = await pool.query(`
      SELECT 
        'aniversario-' || id as id,
        id as original_id,
        nombre,
        anio::TEXT as anio,
        descripcion,
        estado,
        'aniversario' as tipo,
        fecha_registro
      FROM aniversarios
      WHERE estado IN (0, 1)
      ORDER BY fecha_registro DESC
    `);

    const eventos = await pool.query(`
      SELECT 
        'evento-' || id as id,
        id as original_id,
        nombre,
        anio::TEXT as anio,
        descripcion,
        estado,
        'evento' as tipo,
        fecha_creacion as fecha_registro
      FROM eventos
      WHERE estado IN (0, 1)
      ORDER BY fecha_creacion DESC
    `);

    return [...aniversarios.rows, ...eventos.rows];
  },

  /**
   * Validar un registro (cambiar estado) con logging
   */
  async validarRegistro(tipo, id, nuevoEstado, usuarioId, comentario = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const tabla = tipo === 'aniversario' ? 'aniversarios' : 'eventos';
      const numericId = id.includes('-') ? id.split('-')[1] : id;
      
      // Obtener estado anterior
      const actual = await client.query(`SELECT estado FROM ${tabla} WHERE id = $1`, [numericId]);
      if (actual.rows.length === 0) {
        throw new Error('Registro no encontrado');
      }
      const estadoAnterior = actual.rows[0].estado;
      
      // Actualizar estado
      let updateQuery = `UPDATE ${tabla} SET estado = $1`;
      const updateParams = [nuevoEstado];
      
      if (tipo === 'aniversario' && nuevoEstado === 2) {
        updateQuery += ', validado_por = $2, fecha_validacion = CURRENT_TIMESTAMP WHERE id = $3';
        updateParams.push(usuarioId, numericId);
      } else {
        updateQuery += ' WHERE id = $2';
        updateParams.push(numericId);
      }
      
      updateQuery += ' RETURNING *';
      const resultado = await client.query(updateQuery, updateParams);
      
      // Registrar en log
      await client.query(
        `INSERT INTO log_validaciones (tipo, registro_id, estado_anterior, estado_nuevo, validado_por, comentario)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tipo, numericId, estadoAnterior, nuevoEstado, usuarioId, comentario]
      );
      
      await client.query('COMMIT');
      return resultado.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtener historial de validaciones
   */
  async getHistorialValidaciones(tipo = null, registroId = null) {
    let query = `
      SELECT lv.*, u.nombre_completo as validador_nombre
      FROM log_validaciones lv
      LEFT JOIN usuarios u ON lv.validado_por = u.id
    `;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (tipo) {
      conditions.push(`lv.tipo = $${paramIndex++}`);
      params.push(tipo);
    }
    if (registroId) {
      conditions.push(`lv.registro_id = $${paramIndex++}`);
      params.push(registroId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY lv.fecha_validacion DESC';

    const result = await pool.query(query, params);
    return result.rows;
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
