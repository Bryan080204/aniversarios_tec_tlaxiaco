import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('usuario');
      // Puedes agregar redirección a login si lo necesitas
    }
    return Promise.reject(error);
  }
);

// ==================== AUTENTICACIÓN ====================
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  
  // Helpers para manejo de sesión
  setToken: (token) => localStorage.setItem('auth_token', token),
  getToken: () => localStorage.getItem('auth_token'),
  removeToken: () => localStorage.removeItem('auth_token'),
  setUsuario: (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario)),
  getUsuario: () => {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  },
  removeUsuario: () => localStorage.removeItem('usuario'),
  isAuthenticated: () => !!localStorage.getItem('auth_token'),
  isAdmin: () => {
    const usuario = authAPI.getUsuario();
    return usuario?.rol === 'admin';
  }
};

// ==================== USUARIOS ====================
export const usuariosAPI = {
  getAll: () => api.get('/usuarios'),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`)
};

// ==================== ANIVERSARIOS ====================
export const aniversariosAPI = {
  getAll: (params = {}) => api.get('/aniversarios', { params }),
  getById: (id) => api.get(`/aniversarios/${id}`),
  getByAnio: (anio) => api.get(`/aniversarios/anio/${anio}`),
  create: (data) => api.post('/aniversarios', data),
  update: (id, data) => api.put(`/aniversarios/${id}`, data),
  delete: (id) => api.delete(`/aniversarios/${id}`)
};

// ==================== IMÁGENES ====================
export const imagenesAPI = {
  getAll: () => api.get('/imagenes'),
  getByAniversario: (aniversarioId) => api.get(`/aniversarios/${aniversarioId}/imagenes`),
  
  // Subir imágenes (archivos)
  upload: (aniversarioId, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('imagenes', file);
    });
    return api.post(`/aniversarios/${aniversarioId}/imagenes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Legacy: actualizar con URLs
  updateBulk: (aniversarioId, urls) => api.put(`/aniversarios/${aniversarioId}/imagenes`, { urls }),
  
  update: (id, data) => api.put(`/imagenes/${id}`, data),
  delete: (id) => api.delete(`/imagenes/${id}`)
};

// ==================== EVENTOS ====================
export const eventosAPI = {
  getAll: () => api.get('/eventos'),
  create: (data) => api.post('/eventos', data),
  updateEstado: (id, estado) => api.put(`/eventos/${id}/estado`, { estado })
};

// ==================== ESTADÍSTICAS ====================
export const estadisticasAPI = {
  get: () => api.get('/estadisticas')
};

// ==================== VALIDACIÓN ====================
export const validacionAPI = {
  getRegistros: (params = {}) => api.get('/validacion/registros', { params }),
  getPendientes: () => api.get('/validacion/pendientes'),
  validar: (tipo, id, estado, comentario = null) => 
    api.put(`/validacion/${tipo}/${id}`, { estado, comentario }),
  updateEstado: (tipo, id, estado) => api.put(`/validacion/${tipo}/${id}/estado`, { estado }),
  getHistorial: (tipo = null, registroId = null) => 
    api.get('/validacion/historial', { params: { tipo, registro_id: registroId } })
};

// ==================== ADMINISTRACIÓN ====================
export const adminAPI = {
  vaciarBD: () => api.delete('/admin/vaciar', { data: { confirmacion: 'CONFIRMAR_VACIAR_BD' } }),
  healthCheck: () => api.get('/health')
};

export default api;
