/**
 * Middleware de Autenticación JWT
 * Sistema de Aniversarios TEC Tlaxiaco
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tec-tlaxiaco-secret-key-2024';

/**
 * Middleware para verificar token JWT
 * Puede ser usado de forma opcional (public routes) o requerida
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado, inicie sesión nuevamente' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * Middleware opcional - permite acceso sin token pero adjunta usuario si existe
 */
export function tokenOpcional(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.usuario = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    req.usuario = null;
    next();
  }
}

/**
 * Middleware para verificar rol de administrador
 */
export function soloAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador' 
    });
  }

  next();
}

/**
 * Middleware para verificar roles específicos
 * @param {string[]} rolesPermitidos - Array de roles permitidos
 */
export function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}` 
      });
    }

    next();
  };
}

/**
 * Generar token JWT
 * @param {object} usuario - Datos del usuario
 * @param {string} expiresIn - Tiempo de expiración (default: 24h)
 */
export function generarToken(usuario, expiresIn = '24h') {
  const payload = {
    id: usuario.id,
    username: usuario.username,
    nombre_completo: usuario.nombre_completo,
    email: usuario.email,
    rol: usuario.rol
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Decodificar token sin verificar (para debug)
 */
export function decodificarToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

export default {
  verificarToken,
  tokenOpcional,
  soloAdmin,
  verificarRol,
  generarToken,
  decodificarToken
};
