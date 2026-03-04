<template>
  <div class="layout">
    <SidebarMenu :active="active" @select="active = $event" />

    <div class="main">
      <div class="content-area">
        
        <template v-if="active === 'inicio' || active === 'registro'">
          <AppHeader />

          <div class="content">
            <section class="panel registration-card">
              <div class="panel-header">
                <div class="header-title">
                  <h3>Formulario de Registro / Control</h3>
                </div>
                <div class="status-indicator" :class="statusColorClass" @click="active = 'validacion'">
                  <span class="status-label">ESTADO</span>
                  <div class="status-dot"></div>
                </div>
              </div>

              <div class="form-body">
                <div class="form-section">
                  <h4 class="section-subtitle">Datos del Alumno</h4>
                  <div class="field full-width">
                    <span>Nombre Completo</span>
                    <input 
                      v-model="nombreAlumno" 
                      @input="validarNombre"
                      placeholder="Ej: Juan Pérez Nicolás" 
                    />
                  </div>

                  <div class="input-row">
                    <div class="field">
                      <span>Número de Control</span>
                      <input 
                        v-model="numeroControl" 
                        @input="validarControl"
                        placeholder="Ej: 20730001" 
                        maxlength="8" 
                      />
                    </div>
                    <div class="field">
                      <span>Carrera</span>
                      <select v-model="carreraAlumno">
                        <option value="" disabled selected>Seleccionar...</option>
                        <option value="Sistemas">Ing. en Sistemas Computacionales</option>
                        <option value="Civil">Ing. en Sistemas Civiles</option>
                        <option value="Gestion">Ing. en Gestión Empresarial</option>
                        <option value="Mecatronica">Ing. Mecatrónica</option>
                        <option value="Administracion">Lic. en Administración</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="form-section divider">
                  <h4 class="section-subtitle">Información Adicional</h4>
                  <div class="field full-width">
                    <span>Texto / URL para QR</span>
                    <input v-model="urlBaseQR" placeholder="https://tec-tlaxiaco.mx/aniversario" />
                  </div>
                </div>
              </div>

              <div class="form-footer">
                <button class="btn btn-primary" @click="generarRegistroYQR">GENERAR CÓDIGO QR</button>
                <button class="btn btn-outline" @click="limpiarFormulario">Limpiar</button>
              </div>
            </section>

            <div class="right-column">
              <div class="qr-positioner">
                <QrCard :value="qrFinalValue" />
              </div>

              <section class="panel lowerRight">
                <h3>Zona de Registro (Cuadrícula)</h3>
                <div class="grid">
                  <div class="cell" v-for="(alumno, index) in listaAlumnos" :key="index">
                    <p class="cell-name">{{ alumno.nombre }}</p>
                    <p class="cell-sub">{{ alumno.control }} - {{ alumno.carrera }}</p>
                  </div>
                  <div class="cell empty" v-for="i in Math.max(0, 6 - listaAlumnos.length)" :key="'empty-'+i"></div>
                </div>
              </section>
            </div>
          </div>
        </template>

        <template v-else-if="active === 'informes' || active === 'reportes'">
          <div class="full-view fade-in">
            <section class="panel main-panel">
              <div class="panel-header">
                <h3>Reporte de Alumnos Registrados</h3>
              </div>
              
              <div class="stats-summary">
                <div class="stat-box">
                  <span class="number">{{ listaAlumnos.length }}</span>
                  <span class="label">Total de Registros</span>
                </div>
              </div>

              <div class="table-wrapper">
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Nombre del Alumno</th>
                      <th>N. Control</th>
                      <th>Carrera</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="alumno in listaAlumnos" :key="alumno.control">
                      <td>{{ alumno.nombre }}</td>
                      <td>{{ alumno.control }}</td>
                      <td>{{ alumno.carrera }}</td>
                    </tr>
                    <tr v-if="listaAlumnos.length === 0">
                      <td colspan="3" class="empty-msg">No hay registros almacenados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="active === 'configuracion' || active === 'config'">
          <div class="full-view fade-in">
            <section class="panel main-panel">
              <div class="panel-header">
                <h3>Configuración del Sistema</h3>
              </div>
              
              <div class="config-content">
                <div class="config-card">
                  <h4>Parámetros del QR</h4>
                  <div class="field">
                    <span>URL Base por Defecto</span>
                    <input v-model="urlBaseQR" />
                  </div>
                </div>

                <div class="config-card danger">
                  <h4>Mantenimiento de Datos</h4>
                  <p>Esta acción es irreversible. Se borrarán todos los alumnos de la cuadrícula y del informe.</p>
                  <button class="btn btn-outline red-btn" @click="listaAlumnos = []">
                    VACIAR BASE DE DATOS
                  </button>
                </div>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="active === 'validacion'">
          <div class="full-view">
            <ValidacionView />
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

// --- ESTADO GLOBAL ---
const active = ref('inicio')
const nombreAlumno = ref('')
const numeroControl = ref('')
const carreraAlumno = ref('')
const urlBaseQR = ref('https://tec-tlaxiaco.mx/aniversario')
const qrFinalValue = ref('https://tec-tlaxiaco.mx/aniversario')
const estadoActual = ref(0)
const listaAlumnos = ref([])

// --- LÓGICA DE COLORES ---
const statusColorClass = computed(() => {
  if (estadoActual.value === 1) return 'bg-yellow'
  if (estadoActual.value === 2) return 'bg-green'
  return 'bg-red'
})

// --- VALIDACIONES DE ENTRADA ---
function validarNombre() {
  const original = nombreAlumno.value;
  nombreAlumno.value = nombreAlumno.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
  if (original !== nombreAlumno.value) {
    alert("El nombre solo puede contener letras.");
  }
}

function validarControl() {
  const original = numeroControl.value;
  numeroControl.value = numeroControl.value.replace(/\D/g, '');
  if (original !== numeroControl.value) {
    alert("El número de control solo puede contener números.");
  }
}

// --- GENERACIÓN DE REGISTRO ---
function generarRegistroYQR() {
  if (!nombreAlumno.value || !numeroControl.value || !carreraAlumno.value) {
    alert("Error: Todos los campos del alumno son obligatorios.");
    estadoActual.value = 0
    return
  }

  const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
  const regexNumeros = /^\d+$/;

  if (!regexLetras.test(nombreAlumno.value)) {
    alert("Error: El nombre contiene caracteres no permitidos.");
    return;
  }
  if (!regexNumeros.test(numeroControl.value)) {
    alert("Error: El número de control debe ser numérico.");
    return;
  }

  // Generación del texto para el QR
  const dataString = `ALUMNO: ${nombreAlumno.value}\nCONTROL: ${numeroControl.value}\nCARRERA: ${carreraAlumno.value}\nEVENTO: ${urlBaseQR.value}`;
  qrFinalValue.value = dataString;

  // Agregar a la lista para Informes y Cuadrícula
  listaAlumnos.value.push({
    nombre: nombreAlumno.value,
    control: numeroControl.value,
    carrera: carreraAlumno.value
  });

  estadoActual.value = 2; // Estado Verde
}

function limpiarFormulario() {
  nombreAlumno.value = '';
  numeroControl.value = '';
  carreraAlumno.value = '';
  urlBaseQR.value = 'https://tec-tlaxiaco.mx/aniversario';
  qrFinalValue.value = 'https://tec-tlaxiaco.mx/aniversario';
  estadoActual.value = 0;
}
</script>

<style scoped>
/* ESTILOS BASE */
.layout { display: flex; background: #f4f7f6; min-height: 100vh; }
.main { flex: 1; display: flex; flex-direction: column; }
.content-area { flex: 1; display: flex; flex-direction: column; }
.content { padding: 20px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }

/* PANELES */
.panel { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.header-title h3 { margin: 0; color: #09124D; font-weight: 800; }

/* ESTADO */
.status-indicator { width: 70px; height: 70px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
.status-indicator:hover { transform: scale(1.05); }
.status-label { font-size: 9px; font-weight: 900; color: white; margin-bottom: 4px; }
.status-dot { width: 18px; height: 18px; background: white; border-radius: 50%; }
.bg-red { background: #EF4444; }
.bg-yellow { background: #F59E0B; }
.bg-green { background: #10B981; }

/* FORMULARIO */
.form-body { display: flex; flex-direction: column; gap: 20px; }
.section-subtitle { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px; }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field span { font-size: 13px; font-weight: 700; color: #334155; }
.full-width { grid-column: span 2; }
input, select { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; background: #f8fafc; width: 100%; }
input:focus, select:focus { border-color: #1B3573; background: white; box-shadow: 0 0 0 3px rgba(27,53,115,0.1); }

/* BOTONES */
.form-footer { display: flex; gap: 15px; margin-top: 30px; }
.btn { padding: 14px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 13px; }
.btn-primary { background: #1B3573; color: white; border: none; flex: 2; }
.btn-primary:hover { background: #09124D; }
.btn-outline { background: white; border: 1.5px solid #cbd5e1; color: #64748b; flex: 1; }
.red-btn { color: #ef4444 !important; border-color: #fecaca !important; }

/* CUADRÍCULA */
.right-column { display: flex; flex-direction: column; gap: 20px; }
.qr-positioner { display: flex; justify-content: flex-end; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cell { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; justify-content: center; }
.cell.empty { background: #f1f5f9; border: 1px dashed #cbd5e1; height: 90px; }
.cell-name { font-weight: 800; font-size: 12px; color: #09124D; margin: 0; }
.cell-sub { font-size: 10px; color: #64748b; margin-top: 4px; }
.divider { border-top: 1px dashed #e2e8f0; padding-top: 20px; }

/* SECCIONES INFORMES Y CONFIG */
.full-view { padding: 20px; flex: 1; }
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.stat-box { background: #1B3573; color: white; padding: 20px 40px; border-radius: 15px; display: inline-flex; flex-direction: column; margin-bottom: 25px; }
.stat-box .number { font-size: 32px; font-weight: 900; }
.stat-box .label { font-size: 11px; opacity: 0.8; text-transform: uppercase; }

.report-table { width: 100%; border-collapse: collapse; }
.report-table th { text-align: left; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; }
.report-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.empty-msg { text-align: center; padding: 50px !important; color: #94a3b8; }

.config-content { max-width: 500px; display: flex; flex-direction: column; gap: 25px; }
.config-card { padding: 20px; background: #f8fafc; border-radius: 15px; border: 1px solid #e2e8f0; }
.danger { border-color: #fee2e2; background: #fffcfc; }
</style>