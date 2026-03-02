<template>
  <div class="layout">
    <!-- MENÚ IZQUIERDO -->
    <SidebarMenu :active="active" @select="active = $event" />

    <!-- PARTE DERECHA -->
    <div class="main">
      <!-- HEADER (aquí está el ÚNICO QR) -->
      <AppHeader :qrValue="qrValue" />

      <!-- CONTENIDO -->
      <div class="content">
        <!-- PANEL IZQUIERDO -->
        <section class="panel">
          <h3>Formulario / Control</h3>

          <label class="field">
            <span>Texto para QR</span>
            <input v-model="qrValue" placeholder="Ej: https://tec-tlaxiaco.mx/folio/123" />
          </label>

          <label class="field">
            <span>Nombre</span>
            <input v-model="nombre" placeholder="Ej: Juan Pérez" />
          </label>

          <div class="row">
            <button class="btn primary" type="button">
              Generar
            </button>

            <button class="btn" type="button" @click="limpiar">
              Limpiar
            </button>
          </div>
        </section>

        <!-- PANEL DERECHO (ZONA CUADRÍCULA MÁS ABAJO) -->
        <section class="panel lowerRight">
          <h3>Zona derecha (cuadrícula)</h3>

          <div class="grid">
            <div class="cell" v-for="i in 6" :key="i"></div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SidebarMenu from '../components/SidebarMenu.vue'
import AppHeader from '../components/AppHeader.vue'

const active = ref('inicio')
const qrValue = ref('https://example.com/aniversarios')
const nombre = ref('')

function limpiar() {
  nombre.value = ''
  qrValue.value = 'https://example.com/aniversarios'
}
</script>

<style scoped>
.layout{
  display: flex;
}

.main{
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content{
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel{
  background: var(--white);
  border: 1px solid var(--steel-300);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}

h3{
  margin: 0 0 12px;
  color: var(--navy-900);
  font-weight: 1000;
}

.field{
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.field span{
  font-weight: 800;
  color: var(--slate-700);
}

input{
  border: 1px solid var(--steel-300);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

input:focus{
  border-color: var(--blue-500);
}

.row{
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.btn{
  border: 1px solid var(--steel-300);
  background: var(--mist-200);
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
}

.btn.primary{
  background: var(--blue-600);
  color: var(--white);
  border-color: transparent;
}

/* ✅ BAJA MÁS LA ZONA CUADRÍCULA */
.lowerRight{
  margin-top: 190px; /* ajusta: 200, 240, 300 */
}

.grid{
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cell{
  height: 90px;
  border-radius: 14px;
  background: var(--mist-200);
  border: 1px dashed var(--steel-300);
}
</style>