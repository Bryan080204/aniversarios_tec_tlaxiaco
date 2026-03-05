<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <img src="/logo-itt.png" alt="Instituto Tecnológico de Tlaxiaco" class="logo-instituto">
      <h1 class="pestaña-title">Validar Estados</h1>
    </header>

    <div class="summary-cards">
      <div class="card border-red">
        <span class="count text-red">{{ counts.pendiente }}</span>
        <span class="label">Sin Validar</span>
      </div>
      <div class="card border-yellow">
        <span class="count text-yellow">{{ counts.proceso }}</span>
        <span class="label">En Proceso</span>
      </div>
      <div class="card border-green">
        <span class="count text-green">{{ counts.validado }}</span>
        <span class="label">Validado</span>
      </div>
    </div>

    <div class="main-content">
      <h2 class="section-title">Validación de Datos</h2>
      
      <div v-if="isLoading" class="loading-box">
        <div class="spinner-small"></div>
        <span>Cargando registros...</span>
      </div>

      <table v-else class="status-table">
        <thead>
          <tr>
            <th>Registro</th>
            <th>Año</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in registros" :key="item.id">
            <td>{{ item.nombre }}</td>
            <td>{{ item.anio || item.año }}</td>
            <td>{{ item.descripcion }}</td>
            <td>
              <span :class="['badge', getBadgeClass(item.estado)]">
                {{ getEstadoText(item.estado) }}
              </span>
            </td>
            <td class="text-center actions-cell">
              <div class="status-group">
                <button 
                  class="status-btn" 
                  :class="{ active: item.estado === 0 }"
                  @click="cambiarEstadoRapido(item, 0)"
                  title="Sin Validar"
                >🔴</button>
                <button 
                  class="status-btn" 
                  :class="{ active: item.estado === 1 }"
                  @click="cambiarEstadoRapido(item, 1)"
                  title="En Proceso"
                >🟡</button>
                <button 
                  class="status-btn" 
                  :class="{ active: item.estado === 2 }"
                  @click="cambiarEstadoRapido(item, 2)"
                  title="Validado"
                >🟢</button>
              </div>
              <button
                class="edit-nav-btn"
                @click="abrirModalValidacion(item)"
                title="Ver detalles y validar"
              >👁️ Ver / Validar</button>
            </td>
          </tr>
          <tr v-if="registros.length === 0 && !isLoading">
            <td colspan="5" class="no-data">
              {{ backendConnected ? 'No hay registros para validar' : 'Conectando con el servidor...' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL DE VALIDACIÓN CON DATOS E IMÁGENES -->
    <div v-if="showValidacionModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-validacion">
        <div class="modal-header">
          <h2>Validar Registro</h2>
          <button class="close-btn" @click="cerrarModal">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Datos del registro -->
          <div class="datos-section">
            <h3>📋 Información del Registro</h3>
            <div class="datos-grid">
              <div class="dato-item">
                <span class="dato-label">Nombre:</span>
                <span class="dato-value">{{ registroSeleccionado?.nombre }}</span>
              </div>
              <div class="dato-item">
                <span class="dato-label">Año:</span>
                <span class="dato-value">{{ registroSeleccionado?.anio || registroSeleccionado?.año }}</span>
              </div>
              <div class="dato-item full-width">
                <span class="dato-label">Descripción:</span>
                <span class="dato-value">{{ registroSeleccionado?.descripcion || 'Sin descripción' }}</span>
              </div>
              <div class="dato-item">
                <span class="dato-label">Estado actual:</span>
                <span :class="['badge', getBadgeClass(registroSeleccionado?.estado)]">
                  {{ getEstadoText(registroSeleccionado?.estado) }}
                </span>
              </div>
              <div class="dato-item">
                <span class="dato-label">Fecha de creación:</span>
                <span class="dato-value">{{ formatFecha(registroSeleccionado?.fecha_registro) }}</span>
              </div>
            </div>
          </div>

          <!-- Sección de imágenes -->
          <div class="imagenes-section">
            <h3>🖼️ Imágenes del Registro</h3>
            <div v-if="isLoadingImagenes" class="loading-imagenes">
              <div class="spinner-small"></div>
              <span>Cargando imágenes...</span>
            </div>
            <div v-else-if="imagenesRegistro.length > 0" class="imagenes-grid">
              <div 
                v-for="(img, idx) in imagenesRegistro" 
                :key="idx" 
                class="imagen-item"
                @click="abrirPreview(img)"
              >
                <img :src="getImageUrl(img)" :alt="`Imagen ${idx + 1}`" />
                <span class="imagen-numero">{{ idx + 1 }}</span>
              </div>
            </div>
            <div v-else class="no-imagenes">
              <span>📷</span>
              <p>No hay imágenes asociadas a este registro</p>
            </div>
          </div>

          <!-- Sección de validación -->
          <div class="validacion-section">
            <h3>✅ Cambiar Estado de Validación</h3>
            <div class="estado-selector">
              <button 
                v-for="estado in estados" 
                :key="estado.value"
                :class="['estado-btn', estado.class, { active: nuevoEstado === estado.value }]"
                @click="nuevoEstado = estado.value"
              >
                {{ estado.icon }} {{ estado.label }}
              </button>
            </div>
            <div class="comentario-field">
              <label>Comentario de validación (opcional):</label>
              <textarea 
                v-model="comentarioValidacion" 
                placeholder="Escribe un comentario sobre esta validación..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="cerrarModal">Cancelar</button>
          <button 
            class="btn btn-validar" 
            :disabled="isSaving || nuevoEstado === registroSeleccionado?.estado"
            @click="guardarValidacion"
          >
            <span v-if="isSaving">Guardando...</span>
            <span v-else>💾 Guardar Validación</span>
          </button>
        </div>
      </div>
    </div>

    <!-- PREVIEW DE IMAGEN -->
    <div v-if="showPreview" class="preview-overlay" @click="showPreview = false">
      <img :src="previewUrl" alt="Vista previa" />
      <button class="preview-close" @click="showPreview = false">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { validacionAPI, imagenesAPI, aniversariosAPI } from '../services/api.js';

const emit = defineEmits(['toast']);

const registros = ref([]);
const isLoading = ref(true);
const backendConnected = ref(false);

// Modal de validación
const showValidacionModal = ref(false);
const registroSeleccionado = ref(null);
const imagenesRegistro = ref([]);
const isLoadingImagenes = ref(false);
const nuevoEstado = ref(0);
const comentarioValidacion = ref('');
const isSaving = ref(false);

// Preview de imagen
const showPreview = ref(false);
const previewUrl = ref('');

const estados = [
  { value: 0, label: 'Sin Validar', icon: '🔴', class: 'estado-red' },
  { value: 1, label: 'En Proceso', icon: '🟡', class: 'estado-yellow' },
  { value: 2, label: 'Validado', icon: '🟢', class: 'estado-green' }
];

const counts = computed(() => {
  return {
    pendiente: registros.value.filter(r => r.estado === 0).length,
    proceso: registros.value.filter(r => r.estado === 1).length,
    validado: registros.value.filter(r => r.estado === 2).length,
  };
});

const getBadgeClass = (estado) => {
  if (estado === 0) return 'bg-red';
  if (estado === 1) return 'bg-yellow';
  if (estado === 2) return 'bg-green';
  return '';
};

const getEstadoText = (estado) => {
  const textos = ['Sin Validar', 'En Proceso', 'Validado'];
  return textos[estado] || 'Desconocido';
};

const formatFecha = (fecha) => {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getImageUrl = (img) => {
  if (typeof img === 'string') return img;
  if (img.ruta_archivo) {
    // Si es ruta relativa, agregar el host del backend
    if (img.ruta_archivo.startsWith('/uploads')) {
      return `http://localhost:3001${img.ruta_archivo}`;
    }
    return img.ruta_archivo;
  }
  return img.url || '';
};

async function cargarRegistros() {
  isLoading.value = true;
  try {
    const response = await validacionAPI.getRegistros();
    registros.value = response.data;
    backendConnected.value = true;
  } catch (error) {
    console.warn('No se pudo conectar al backend');
    backendConnected.value = false;
    registros.value = [
      { id: 1, nombre: 'Aniversario 2026', anio: 2026, descripcion: 'Sin conexión al servidor', estado: 0 },
      { id: 2, nombre: 'Aniversario 2025', anio: 2025, descripcion: 'Inicie el backend', estado: 1 },
    ];
  } finally {
    isLoading.value = false;
  }
}

async function abrirModalValidacion(item) {
  registroSeleccionado.value = item;
  nuevoEstado.value = item.estado;
  comentarioValidacion.value = '';
  imagenesRegistro.value = [];
  showValidacionModal.value = true;
  
  // Cargar imágenes del registro
  isLoadingImagenes.value = true;
  try {
    if (backendConnected.value && item.id) {
      const response = await imagenesAPI.getByAniversario(item.id);
      imagenesRegistro.value = response.data || [];
    }
  } catch (error) {
    console.warn('Error al cargar imágenes:', error);
  } finally {
    isLoadingImagenes.value = false;
  }
}

function cerrarModal() {
  showValidacionModal.value = false;
  registroSeleccionado.value = null;
  imagenesRegistro.value = [];
}

async function cambiarEstadoRapido(item, nuevoEstado) {
  if (item.estado === nuevoEstado) return;
  
  const estadoAnterior = item.estado;
  item.estado = nuevoEstado;

  try {
    if (backendConnected.value && item.id) {
      await validacionAPI.validar('aniversario', item.id, nuevoEstado);
    }
    emit('toast', `Estado actualizado a: ${getEstadoText(nuevoEstado)}`, 'success');
  } catch (error) {
    item.estado = estadoAnterior;
    emit('toast', 'Error al actualizar estado', 'error');
  }
}

async function guardarValidacion() {
  if (!registroSeleccionado.value) return;
  
  isSaving.value = true;
  try {
    if (backendConnected.value) {
      await validacionAPI.validar(
        'aniversario', 
        registroSeleccionado.value.id, 
        nuevoEstado.value, 
        comentarioValidacion.value || null
      );
    }
    
    // Actualizar el registro en la lista local
    const idx = registros.value.findIndex(r => r.id === registroSeleccionado.value.id);
    if (idx !== -1) {
      registros.value[idx].estado = nuevoEstado.value;
    }
    
    emit('toast', `Registro validado correctamente: ${getEstadoText(nuevoEstado.value)}`, 'success');
    cerrarModal();
  } catch (error) {
    emit('toast', 'Error al guardar la validación', 'error');
  } finally {
    isSaving.value = false;
  }
}

function abrirPreview(img) {
  previewUrl.value = getImageUrl(img);
  showPreview.value = true;
}

onMounted(() => {
  cargarRegistros();
});
</script>

<style scoped>
.dashboard-container { background-color: #f4f6f9; padding: 20px; font-family: sans-serif; min-height: 100%; }
.dashboard-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; border-bottom: 1px solid #DDE0E5; padding-bottom: 10px; }
.logo-instituto { height: 70px; width: auto; }
.pestaña-title { color: #09124D; font-size: 1.4rem; }

.summary-cards { display: flex; gap: 15px; margin-bottom: 25px; }
.card { background: #FEFEFE; flex: 1; padding: 15px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-bottom: 4px solid; }
.count { font-size: 2rem; font-weight: bold; display: block; }
.label { color: #565A73; font-size: 0.8rem; font-weight: 600; }

.border-red { border-color: #EF4444; }
.text-red { color: #EF4444; }
.border-yellow { border-color: #F59E0B; }
.text-yellow { color: #F59E0B; }
.border-green { border-color: #10B981; }
.text-green { color: #10B981; }

.main-content { background: #FEFEFE; padding: 20px; border-radius: 10px; border: 1px solid #DDE0E5; }
.section-title { color: #09124D; font-size: 1.1rem; margin: 0 0 20px; }

.status-table { width: 100%; border-collapse: collapse; }
.status-table th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #DDE0E5; color: #565A73; font-size: 0.9rem; }
.status-table td { padding: 12px; border-bottom: 1px solid #DDE0E5; font-size: 0.9rem; }

.badge { padding: 4px 12px; border-radius: 15px; color: white; font-weight: bold; font-size: 0.7rem; text-transform: uppercase; }
.bg-red { background: #EF4444; }
.bg-yellow { background: #F59E0B; }
.bg-green { background: #10B981; }

.no-data { text-align: center; padding: 40px; color: #B4B7BC; font-style: italic; }

.actions-cell { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 250px; }
.status-group { display: flex; gap: 6px; }
.edit-nav-btn {
  border: 1px solid #1B3573;
  color: #1B3573;
  background: #ffffff;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.edit-nav-btn:hover { background: #dbe4ff; }
.status-btn { background: none; border: 2px solid transparent; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 8px; transition: 0.2s; opacity: 0.5; }
.status-btn:hover { opacity: 1; transform: scale(1.1); }
.status-btn.active { opacity: 1; border-color: #1B3573; background: #f0f4ff; }

.loading-box { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 40px; color: #64748b; }
.spinner-small { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #1B3573; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.text-center { text-align: center; }

/* ========== MODAL DE VALIDACIÓN ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-validacion {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h2 {
  margin: 0;
  color: #09124D;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  padding: 4px 8px;
  border-radius: 8px;
}

.close-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-body h3 {
  color: #09124D;
  font-size: 1rem;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

/* Datos del registro */
.datos-section {
  margin-bottom: 24px;
}

.datos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dato-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dato-item.full-width {
  grid-column: span 2;
}

.dato-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.dato-value {
  font-size: 14px;
  color: #1e293b;
}

/* Sección de imágenes */
.imagenes-section {
  margin-bottom: 24px;
}

.imagenes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.imagen-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: 0.2s;
}

.imagen-item:hover {
  border-color: #1B3573;
  transform: scale(1.02);
}

.imagen-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.imagen-numero {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.loading-imagenes, .no-imagenes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #94a3b8;
  gap: 12px;
}

.no-imagenes span {
  font-size: 48px;
}

/* Sección de validación */
.validacion-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
}

.estado-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.estado-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: 0.2s;
}

.estado-btn:hover {
  transform: translateY(-2px);
}

.estado-btn.active {
  border-width: 3px;
}

.estado-btn.estado-red.active { border-color: #EF4444; background: #fef2f2; }
.estado-btn.estado-yellow.active { border-color: #F59E0B; background: #fffbeb; }
.estado-btn.estado-green.active { border-color: #10B981; background: #ecfdf5; }

.comentario-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comentario-field label {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.comentario-field textarea {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: 0.2s;
}

.comentario-field textarea:focus {
  border-color: #1B3573;
  box-shadow: 0 0 0 3px rgba(27, 53, 115, 0.1);
}

/* Footer del modal */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-cancel {
  background: white;
  border: 1.5px solid #cbd5e1;
  color: #64748b;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-validar {
  background: #1B3573;
  border: none;
  color: white;
}

.btn-validar:hover {
  background: #09124D;
}

.btn-validar:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* Preview de imagen */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
}

.preview-overlay img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .datos-grid {
    grid-template-columns: 1fr;
  }
  
  .dato-item.full-width {
    grid-column: span 1;
  }
  
  .imagenes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .estado-selector {
    flex-direction: column;
  }
}
</style>
