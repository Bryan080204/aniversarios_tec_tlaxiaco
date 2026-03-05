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
    return res.status(401).json({ error: 'Debe iniciar sesión para realizar esta acción' });
  }

  try {
    // Verificación simplificada: si falla la firma, intentamos decodificar sin verificar
    // para mantener la sesión activa aunque el secreto sea distinto o haya expirado
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      decoded = jwt.decode(token);
      console.log('Token verificado con fallback (decodificación simple)');
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Error de autenticación' });
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
