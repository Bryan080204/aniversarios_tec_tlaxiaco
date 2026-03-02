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
      
      <table class="status-table">
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
            <td class="text-center actions-dots">•••</td>
          </tr>
          <tr v-if="registros.length === 0">
            <td colspan="5" class="no-data">Esperando datos de la base de datos...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 1. Iniciamos con un arreglo vacío (Aquí caerá lo de la base de datos)
const registros = ref([]);

// 2. Lógica de contadores dinámica
const counts = computed(() => {
  return {
    pendiente: registros.value.filter(r => r.estado === 0).length,
    proceso: registros.value.filter(r => r.estado === 1).length,
    validado: registros.value.filter(r => r.estado === 2).length,
  };
});

// 3. Colores del semáforo (Rojo, Amarillo, Verde)
const getBadgeClass = (estado) => {
  if (estado === 0) return 'bg-red';    // Sin Validar
  if (estado === 1) return 'bg-yellow'; // En Proceso
  if (estado === 2) return 'bg-green';  // Validado
  return '';
};

// 4. Texto del estado
const getEstadoText = (estado) => {
  const textos = ['Sin Validar', 'En Proceso', 'Validado'];
  return textos[estado] || 'Desconocido';
};

// 5. Espacio para la futura conexión con el Backend
onMounted(async () => {
  // Aquí es donde harás el fetch a tu API de Node.js más adelante
  // console.log("Listo para jalar datos...");
});
</script>

<style scoped>
/* Estilos adaptados a tu paleta navy/slate */
.dashboard-container { background-color: #f4f6f9; padding: 20px; font-family: sans-serif; }
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
.status-table { width: 100%; border-collapse: collapse; }
.status-table th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #DDE0E5; color: #565A73; font-size: 0.9rem; }
.status-table td { padding: 12px; border-bottom: 1px solid #DDE0E5; font-size: 0.9rem; }

.badge { padding: 4px 12px; border-radius: 15px; color: white; font-weight: bold; font-size: 0.7rem; text-transform: uppercase; }
.bg-red { background: #EF4444; }
.bg-yellow { background: #F59E0B; }
.bg-green { background: #10B981; }

.no-data { text-align: center; padding: 40px; color: #B4B7BC; font-style: italic; }
.actions-dots { color: #B4B7BC; font-size: 1.2rem; cursor: pointer; }
</style>