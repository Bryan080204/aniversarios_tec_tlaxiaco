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
            <td>{{ item.año }}</td>
            <td>{{ item.descripcion }}</td>
            <td>
              <span :class="['badge', getBadgeClass(item.estado)]">
                {{ getEstadoText(item.estado) }}
              </span>
            </td>
            <td class="text-center actions-cell">
              <button 
                class="status-btn" 
                :class="{ active: item.estado === 0 }"
                @click="cambiarEstado(item, 0)"
                title="Sin Validar"
              >🔴</button>
              <button 
                class="status-btn" 
                :class="{ active: item.estado === 1 }"
                @click="cambiarEstado(item, 1)"
                title="En Proceso"
              >🟡</button>
              <button 
                class="status-btn" 
                :class="{ active: item.estado === 2 }"
                @click="cambiarEstado(item, 2)"
                title="Validado"
              >🟢</button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { validacionAPI } from '../services/api.js';

const emit = defineEmits(['toast']);

const registros = ref([]);
const isLoading = ref(true);
const backendConnected = ref(false);

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

async function cargarRegistros() {
  isLoading.value = true;
  try {
    const response = await validacionAPI.getRegistros();
    registros.value = response.data;
    backendConnected.value = true;
  } catch (error) {
    console.warn('No se pudo conectar al backend');
    backendConnected.value = false;
    // Datos de ejemplo si no hay conexión
    registros.value = [
      { id: 'demo-1', nombre: 'Registro Demo 1', año: '2026', descripcion: 'Sin conexión al servidor', estado: 0 },
      { id: 'demo-2', nombre: 'Registro Demo 2', año: '2026', descripcion: 'Inicie el backend con: npm run server', estado: 1 },
    ];
  } finally {
    isLoading.value = false;
  }
}

async function cambiarEstado(item, nuevoEstado) {
  if (item.estado === nuevoEstado) return;
  
  const estadoAnterior = item.estado;
  item.estado = nuevoEstado; // Optimistic update

  try {
    if (backendConnected.value && !item.id.startsWith('demo')) {
      const [tipo, id] = item.id.split('-');
      await validacionAPI.updateEstado(tipo, id, nuevoEstado);
    }
    emit('toast', `Estado actualizado a: ${getEstadoText(nuevoEstado)}`, 'success');
  } catch (error) {
    item.estado = estadoAnterior; // Revert
    emit('toast', 'Error al actualizar estado', 'error');
  }
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

.border-red { border-color: #EF4444; } .text-red { color: #EF4444; }
.border-yellow { border-color: #F59E0B; } .text-yellow { color: #F59E0B; }
.border-green { border-color: #10B981; } .text-green { color: #10B981; }

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

.actions-cell { display: flex; gap: 6px; justify-content: center; }
.status-btn { background: none; border: 2px solid transparent; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 8px; transition: 0.2s; opacity: 0.5; }
.status-btn:hover { opacity: 1; transform: scale(1.1); }
.status-btn.active { opacity: 1; border-color: #1B3573; background: #f0f4ff; }

.loading-box { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 40px; color: #64748b; }
.spinner-small { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #1B3573; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>