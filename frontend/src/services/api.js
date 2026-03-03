import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================== ALUMNOS ====================
export const alumnosAPI = {
  getAll: (params = {}) => api.get('/alumnos', { params }),
  getById: (id) => api.get(`/alumnos/${id}`),
  create: (data) => api.post('/alumnos', data),
  update: (id, data) => api.put(`/alumnos/${id}`, data),
  delete: (id) => api.delete(`/alumnos/${id}`)
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

export default api;
