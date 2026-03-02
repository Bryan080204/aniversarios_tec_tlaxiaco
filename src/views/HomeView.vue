<template>
  <div class="layout">
    <SidebarMenu :active="active" @select="active = $event" />

    <div class="main">
      
      <div class="content-area">
        
        <template v-if="active === 'inicio' || active === 'registro'">
          
          <AppHeader />

          <div class="content">
            <section class="panel">
              <div class="panel-header">
                <h3>Formulario / Control</h3>
                <div class="status-square" :class="statusColorClass" @click="active = 'validacion'">
                  <span>ESTADO</span>
                  <div class="dot"></div>
                </div>
              </div>

              <label class="field">
                <span>Texto para QR</span>
                <input v-model="qrValue" placeholder="Ej: https://tec-tlaxiaco.mx/folio/123" />
              </label>

              <label class="field">
                <span>Nombre</span>
                <input v-model="nombre" placeholder="Ej: Juan Pérez" />
              </label>

              <div class="row">
                <button class="btn primary" type="button">Generar</button>
                <button class="btn" type="button" @click="limpiar">Limpiar</button>
              </div>
            </section>

            <div class="right-column">
              
              <div class="qr-positioner">
                <QrCard :value="qrValue" />
              </div>

              <section class="panel lowerRight">
                <h3>Zona derecha (cuadrícula)</h3>
                <div class="grid">
                  <div class="cell" v-for="i in 6" :key="i"></div>
                </div>
              </section>
            </div>
          </div>
        </template>

        <template v-else-if="active === 'validacion'">
          <div class="full-view">
            <ValidacionView />
          </div>
        </template>

        <template v-else>
          <div class="panel">
            <h3>Sección: {{ active }}</h3>
            <p>Contenido en desarrollo...</p>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SidebarMenu from '../components/SidebarMenu.vue'
import AppHeader from '../components/AppHeader.vue'
import QrCard from '../components/QrCard.vue' 
import ValidacionView from './ValidacionView.vue'

const active = ref('inicio')
const qrValue = ref('https://example.com/aniversarios')
const nombre = ref('')
const estadoActual = ref(0) 

const statusColorClass = computed(() => {
  if (estadoActual.value === 1) return 'bg-yellow'
  if (estadoActual.value === 2) return 'bg-green'
  return 'bg-red'
})

function limpiar() {
  nombre.value = ''
  qrValue.value = 'https://example.com/aniversarios'
}
</script>

<style scoped>
/* ESTILOS ORIGINALES MANTENIDOS */
.layout{ display: flex; }
.main{ flex: 1; min-height: 100vh; display: flex; flex-direction: column; }
.content-area { flex: 1; display: flex; flex-direction: column; }
.content{ padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.right-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Alinea el QrCard a la derecha */
  gap: 15px;
}

.qr-positioner {
  margin-bottom: 5px; /* Lo separa un poco de la cuadrícula */
}

.panel{
  background: var(--white);
  border: 1px solid var(--steel-300);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  width: 100%;
}

.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }

.status-square {
  width: 60px; height: 60px; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
.status-square span { font-size: 8px; font-weight: 1000; color: white; }
.dot { width: 16px; height: 16px; background: white; border-radius: 50%; margin-top: 2px; }

.bg-red { background: #EF4444; border: 2px solid #B91C1C; }
.bg-yellow { background: #F59E0B; border: 2px solid #B45309; }
.bg-green { background: #10B981; border: 2px solid #047857; }

h3{ margin: 0 0 12px; color: var(--navy-900); font-weight: 1000; }
.field{ display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.field span{ font-weight: 800; color: var(--slate-700); }

input{
  border: 1px solid var(--steel-300); border-radius: 12px;
  padding: 10px 12px; font-size: 14px; outline: none;
}

.row{ display: flex; gap: 10px; margin-top: 6px; }
.btn{
  border: 1px solid var(--steel-300); background: var(--mist-200);
  padding: 10px 12px; border-radius: 12px; font-weight: 900; cursor: pointer;
}
.btn.primary{ background: var(--blue-600); color: var(--white); border-color: transparent; }

.lowerRight{
  margin-top: 0px; 
}

.grid{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.cell{ height: 90px; border-radius: 14px; background: var(--mist-200); border: 1px dashed var(--steel-300); }

.full-view { padding: 16px; flex: 1; }
</style>