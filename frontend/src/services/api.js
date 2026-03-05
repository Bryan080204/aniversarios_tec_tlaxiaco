import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  create: (aniversarioId, data) => api.post(`/aniversarios/${aniversarioId}/imagenes`, data),
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
  getRegistros: () => api.get('/validacion/registros'),
  updateEstado: (tipo, id, estado) => api.put(`/validacion/${tipo}/${id}/estado`, { estado })
};

// ==================== ADMINISTRACIÓN ====================
export const adminAPI = {
  vaciarBD: () => api.delete('/admin/vaciar', { data: { confirmacion: 'CONFIRMAR_VACIAR_BD' } }),
  healthCheck: () => api.get('/health')
};

export default api;
