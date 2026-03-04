<template>
  <div class="layout">
    <SidebarMenu :active="active" @select="handleMenuSelect" />

    <div class="main">
      <div class="content-area">
        
        <!-- TOAST NOTIFICATION -->
        <ToastNotification 
          :show="toast.show" 
          :message="toast.message" 
          :type="toast.type"
          @close="toast.show = false"
        />

        <AppHeader />

        <!-- ============ INICIO / REGISTRO ============ -->
        <template v-if="active === 'inicio' || active === 'registro'">
          <div class="content">
            <section class="panel registration-card">
              <div class="panel-header">
                <div class="header-title">
                  <h3>Formulario de Registro / Control</h3>
                  <p class="subtitle">Sistema de registro para eventos del TEC Tlaxiaco</p>
                </div>
                <div class="header-right">
                  <div class="status-indicator" :class="statusColorClass" @click="active = 'validacion'">
                    <span class="status-label">ESTADO</span>
                    <div class="status-dot"></div>
                  </div>
                  <QrCard
                    class="qr-inline"
                    :value="qrFinalValue"
                    :size="88"
                    :margin="1"
                    :show-text="false"
                    logo-src="/logo-itt.png"
                  />
                </div>
              </div>

              <div class="form-body">
                <div class="form-section">
                  <h4 class="section-subtitle">Datos del Aniversario</h4>
                  <div class="field full-width">
                    <span>Año de aniversario</span>
                    <input 
                      v-model="anioAniversario" 
                      @input="validarAnio"
                      placeholder="Ej: 2026"
                      maxlength="4"
                    />
                  </div>

                  <div class="field full-width">
                    <span>Descripción</span>
                    <input
                      v-model="descripcionAniversario"
                      placeholder="Ej: Celebración del aniversario institucional"
                    />
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
                <button class="btn btn-primary" @click="generarRegistroYQR" :disabled="isLoading">
                  <LoadingSpinner v-if="isLoading" size="small" />
                  <span v-else>GENERAR CÓDIGO QR</span>
                </button>
                <button class="btn btn-outline" @click="limpiarFormulario">Limpiar</button>
              </div>
            </section>

            <div class="right-column">
              <section class="panel lowerRight">
                <h3>Últimos Registros</h3>
                <div class="anniversary-grid">
                  <div class="anniversary-cell" v-for="(imagen, index) in imagenesAniversario" :key="index">
                    <img :src="imagen" :alt="`Aniversario ${index + 1}`" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </template>

        <!-- ============ INFORMES / REPORTES ============ -->
        <template v-else-if="active === 'informes' || active === 'reportes'">
          <div class="full-view fade-in">
            <section class="panel main-panel">
              <div class="panel-header">
                <h3>Reporte de Registros de Aniversario</h3>
                <button class="btn btn-outline" @click="exportarCSV">
                  📥 Exportar CSV
                </button>
              </div>
              
              <div class="stats-row">
                <div class="stat-box">
                  <span class="number">{{ estadisticas.totalAlumnos || listaAlumnos.length }}</span>
                  <span class="label">Total de Registros</span>
                </div>
              </div>

              <!-- BUSCADOR -->
              <SearchBar 
                v-model="busqueda" 
                placeholder="Buscar por registro, año o descripción..."
              >
                <template #filters>
                  <select v-model="filtroEstado" class="filter-select">
                    <option value="">Todos los estados</option>
                    <option value="0">Sin validar</option>
                    <option value="1">En proceso</option>
                    <option value="2">Validado</option>
                  </select>
                </template>
              </SearchBar>

              <LoadingSpinner v-if="isLoadingList" text="Cargando registros..." />
              <div v-else class="table-wrapper">
                <table class="report-table">
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
                    <tr v-for="alumno in alumnosFiltrados" :key="alumno.id || alumno.numero_control">
                      <td>{{ alumno.nombre }}</td>
                      <td><code>{{ getAnioRegistro(alumno.nombre) }}</code></td>
                      <td>{{ alumno.carrera }}</td>
                      <td>
                        <span class="badge" :class="getBadgeClass(alumno.estado)">
                          {{ getEstadoText(alumno.estado) }}
                        </span>
                      </td>
                      <td class="text-center actions-cell">
                        <button class="action-btn edit" @click="editarAlumno(alumno)" title="Editar">✏️</button>
                        <button class="action-btn delete" @click="confirmarEliminar(alumno)" title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                    <tr v-if="alumnosFiltrados.length === 0">
                      <td colspan="5" class="empty-msg">
                        {{ busqueda || filtroEstado ? 'No se encontraron resultados' : 'No hay registros de aniversario.' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </template>

        <!-- ============ CONFIGURACIÓN ============ -->
        <template v-else-if="active === 'configuracion' || active === 'config'">
          <div class="full-view fade-in">
            <section class="panel main-panel">
              <div class="panel-header">
                <h3>Configuración del Sistema</h3>
              </div>
              
              <div class="config-content">
                <div class="config-card">
                  <h4>🔗 Estado del Backend</h4>
                  <div class="connection-status" :class="backendConnected ? 'connected' : 'disconnected'">
                    <span class="status-dot-small"></span>
                    <span>{{ backendConnected ? 'Conectado' : 'Desconectado' }}</span>
                  </div>
                  <p class="hint">API: http://localhost:3001</p>
                  <button class="btn btn-outline" @click="verificarConexion">
                    Verificar Conexión
                  </button>
                </div>

                <div class="config-card">
                  <h4>📱 Parámetros del QR</h4>
                  <div class="field">
                    <span>URL Base por Defecto</span>
                    <input v-model="urlBaseQR" />
                  </div>
                </div>

                <div class="config-card danger">
                  <h4>⚠️ Mantenimiento de Datos</h4>
                  <p>Esta acción es irreversible. Se borrarán todos los alumnos del sistema.</p>
                  <button class="btn btn-outline red-btn" @click="confirmarVaciar">
                    VACIAR BASE DE DATOS
                  </button>
                </div>
              </div>
            </section>
          </div>
        </template>

        <!-- ============ VALIDACIÓN ============ -->
        <template v-else-if="active === 'validacion'">
          <div class="full-view">
            <ValidacionView @toast="mostrarToast" />
          </div>
        </template>

      </div>
    </div>

    <!-- MODAL EDITAR -->
    <ModalDialog :show="showEditModal" title="Editar Alumno" @close="showEditModal = false">
      <div class="modal-form">
        <div class="field">
          <span>Nombre Completo</span>
          <input v-model="editForm.nombre" />
        </div>
        <div class="field">
          <span>Número de Control</span>
          <input v-model="editForm.numero_control" maxlength="8" />
        </div>
        <div class="field">
          <span>Carrera</span>
          <select v-model="editForm.carrera">
            <option value="Sistemas">Ing. en Sistemas Computacionales</option>
            <option value="Civil">Ing. en Sistemas Civiles</option>
            <option value="Gestion">Ing. en Gestión Empresarial</option>
            <option value="Mecatronica">Ing. Mecatrónica</option>
            <option value="Administracion">Lic. en Administración</option>
          </select>
        </div>
        <div class="field">
          <span>Estado</span>
          <select v-model="editForm.estado">
            <option :value="0">Sin Validar</option>
            <option :value="1">En Proceso</option>
            <option :value="2">Validado</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showEditModal = false">Cancelar</button>
        <button class="btn btn-primary" @click="guardarEdicion">Guardar</button>
      </template>
    </ModalDialog>

    <!-- MODAL CONFIRMAR ELIMINAR -->
    <ModalDialog :show="showDeleteModal" title="Confirmar Eliminación" size="small" @close="showDeleteModal = false">
      <p>¿Estás seguro de que deseas eliminar a <strong>{{ alumnoAEliminar?.nombre }}</strong>?</p>
      <p class="warning-text">Esta acción no se puede deshacer.</p>
      <template #footer>
        <button class="btn btn-outline" @click="showDeleteModal = false">Cancelar</button>
        <button class="btn btn-primary red-bg" @click="eliminarAlumno">Eliminar</button>
      </template>
    </ModalDialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarMenu from '../components/SidebarMenu.vue'
import AppHeader from '../components/AppHeader.vue'
import QrCard from '../components/QrCard.vue' 
import ValidacionView from './ValidacionView.vue'
import ToastNotification from '../components/ToastNotification.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import SearchBar from '../components/SearchBar.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { alumnosAPI, estadisticasAPI } from '../services/api.js'

const route = useRoute()
const router = useRouter()

// --- ESTADO GLOBAL ---
const active = ref('inicio')
const anioAniversario = ref('')
const descripcionAniversario = ref('')
const urlBaseQR = ref('https://tec-tlaxiaco.mx/aniversario')
const qrFinalValue = ref('https://tec-tlaxiaco.mx/aniversario')
const estadoActual = ref(0)
const listaAlumnos = ref([])
const estadisticas = ref({})
const backendConnected = ref(false)

// --- ESTADOS DE UI ---
const isLoading = ref(false)
const isLoadingList = ref(false)
const busqueda = ref('')
const filtroEstado = ref('')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editForm = ref({})
const alumnoAEliminar = ref(null)
const imagenesAniversario = [
  'https://picsum.photos/seed/aniversario-1/500/320',
  'https://picsum.photos/seed/aniversario-2/500/320',
  'https://picsum.photos/seed/aniversario-3/500/320',
  'https://picsum.photos/seed/aniversario-4/500/320',
  'https://picsum.photos/seed/aniversario-5/500/320',
  'https://picsum.photos/seed/aniversario-6/500/320'
]

// --- TOAST ---
const toast = ref({ show: false, message: '', type: 'info' })

function mostrarToast(message, type = 'info') {
  toast.value = { show: true, message, type }
}

// --- ROUTER SYNC ---
onMounted(() => {
  if (route.meta.section) {
    active.value = route.meta.section
  }
  cargarDatos()
  verificarConexion()
})

watch(() => route.meta.section, (newSection) => {
  if (newSection) active.value = newSection
})

function handleMenuSelect(section) {
  active.value = section
  const routes = {
    'inicio': '/',
    'registro': '/registro',
    'reportes': '/reportes',
    'config': '/configuracion',
    'validacion': '/validacion'
  }
  if (routes[section]) {
    router.push(routes[section])
  }
}

// --- CARGAR DATOS ---
async function cargarDatos() {
  isLoadingList.value = true
  try {
    const [alumnosRes, statsRes] = await Promise.all([
      alumnosAPI.getAll(),
      estadisticasAPI.get()
    ])
    listaAlumnos.value = alumnosRes.data
    estadisticas.value = statsRes.data
    backendConnected.value = true
  } catch (error) {
    console.warn('Backend no disponible, usando modo local')
    backendConnected.value = false
  } finally {
    isLoadingList.value = false
  }
}

async function verificarConexion() {
  try {
    await estadisticasAPI.get()
    backendConnected.value = true
    mostrarToast('Conexión establecida con el servidor', 'success')
  } catch {
    backendConnected.value = false
    mostrarToast('No se pudo conectar al servidor', 'error')
  }
}

// --- LÓGICA DE COLORES ---
const statusColorClass = computed(() => {
  if (estadoActual.value === 1) return 'bg-yellow'
  if (estadoActual.value === 2) return 'bg-green'
  return 'bg-red'
})

// --- FILTROS ---
const alumnosFiltrados = computed(() => {
  let resultado = listaAlumnos.value
  
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    resultado = resultado.filter(a => 
      a.nombre.toLowerCase().includes(term) ||
      a.carrera.toLowerCase().includes(term) ||
      getAnioRegistro(a.nombre).includes(term)
    )
  }
  
  if (filtroEstado.value !== '') {
    resultado = resultado.filter(a => String(a.estado) === filtroEstado.value)
  }
  
  return resultado
})

// --- VALIDACIONES DE ENTRADA ---
function validarAnio() {
  anioAniversario.value = anioAniversario.value.replace(/\D/g, '').slice(0, 4)
}

// --- GENERACIÓN DE REGISTRO ---
async function generarRegistroYQR() {
  if (!anioAniversario.value || anioAniversario.value.length !== 4) {
    mostrarToast('El año de aniversario es obligatorio y debe tener 4 dígitos', 'error')
    estadoActual.value = 0
    return
  }

  const anioNumero = Number(anioAniversario.value)
  if (anioNumero < 1900 || anioNumero > 2100) {
    mostrarToast('Ingresa un año válido', 'error')
    return
  }

  if (!descripcionAniversario.value.trim()) {
    mostrarToast('La descripción es obligatoria', 'error')
    return
  }

  const nombreGenerado = `Aniversario ${anioAniversario.value}`
  const numeroGenerado = `${anioAniversario.value}${String(Date.now()).slice(-4)}`
  const carreraGenerada = descripcionAniversario.value.trim()

  isLoading.value = true

  try {
    // Guardar en backend
    if (backendConnected.value) {
      await alumnosAPI.create({
        nombre: nombreGenerado,
        numero_control: numeroGenerado,
        carrera: carreraGenerada
      })
      await cargarDatos()
    } else {
      // Modo local
      listaAlumnos.value.unshift({
        id: Date.now(),
        nombre: nombreGenerado,
        numero_control: numeroGenerado,
        carrera: carreraGenerada,
        estado: 0
      })
    }

    // Generación del texto para el QR
    const dataString = `${urlBaseQR.value}/${anioAniversario.value}?descripcion=${encodeURIComponent(descripcionAniversario.value.trim())}`
    qrFinalValue.value = dataString
    estadoActual.value = 2
    
    mostrarToast('Registro de aniversario generado correctamente', 'success')
  } catch (error) {
    mostrarToast(error.response?.data?.error || 'Error al registrar', 'error')
  } finally {
    isLoading.value = false
  }
}

function limpiarFormulario() {
  anioAniversario.value = ''
  descripcionAniversario.value = ''
  urlBaseQR.value = 'https://tec-tlaxiaco.mx/aniversario'
  qrFinalValue.value = 'https://tec-tlaxiaco.mx/aniversario'
  estadoActual.value = 0
}

// --- EDITAR / ELIMINAR ---
function editarAlumno(alumno) {
  editForm.value = { ...alumno }
  showEditModal.value = true
}

async function guardarEdicion() {
  try {
    if (backendConnected.value) {
      await alumnosAPI.update(editForm.value.id, editForm.value)
      await cargarDatos()
    } else {
      const index = listaAlumnos.value.findIndex(a => a.id === editForm.value.id)
      if (index !== -1) {
        listaAlumnos.value[index] = { ...editForm.value }
      }
    }
    showEditModal.value = false
    mostrarToast('Alumno actualizado correctamente', 'success')
  } catch (error) {
    mostrarToast('Error al actualizar', 'error')
  }
}

function confirmarEliminar(alumno) {
  alumnoAEliminar.value = alumno
  showDeleteModal.value = true
}

async function eliminarAlumno() {
  try {
    if (backendConnected.value) {
      await alumnosAPI.delete(alumnoAEliminar.value.id)
      await cargarDatos()
    } else {
      listaAlumnos.value = listaAlumnos.value.filter(a => a.id !== alumnoAEliminar.value.id)
    }
    showDeleteModal.value = false
    mostrarToast('Alumno eliminado correctamente', 'success')
  } catch (error) {
    mostrarToast('Error al eliminar', 'error')
  }
}

async function confirmarVaciar() {
  if (confirm('¿Estás seguro de vaciar TODA la base de datos?')) {
    listaAlumnos.value = []
    mostrarToast('Base de datos vaciada', 'warning')
  }
}

// --- UTILIDADES ---
function getBadgeClass(estado) {
  if (estado === 0) return 'bg-red'
  if (estado === 1) return 'bg-yellow'
  if (estado === 2) return 'bg-green'
  return ''
}

function getEstadoText(estado) {
  const textos = ['Sin Validar', 'En Proceso', 'Validado']
  return textos[estado] || 'Desconocido'
}

function getAnioRegistro(nombre) {
  const match = String(nombre || '').match(/\b(19|20)\d{2}\b/)
  return match ? match[0] : 'N/A'
}

function exportarCSV() {
  const headers = ['Registro', 'Año', 'Descripción', 'Estado']
  const rows = alumnosFiltrados.value.map(a => [
    a.nombre,
    getAnioRegistro(a.nombre),
    a.carrera,
    getEstadoText(a.estado)
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `alumnos_tec_tlaxiaco_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  mostrarToast('Archivo CSV descargado', 'success')
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
.header-right { display: flex; align-items: center; gap: 12px; }
.header-title h3 { margin: 0; color: #09124D; font-weight: 800; }
.subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }

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
input, select { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; background: #f8fafc; width: 100%; box-sizing: border-box; }
input:focus, select:focus { border-color: #1B3573; background: white; box-shadow: 0 0 0 3px rgba(27,53,115,0.1); }

/* BOTONES */
.form-footer { display: flex; gap: 15px; margin-top: 30px; }
.btn { padding: 14px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary { background: #1B3573; color: white; border: none; flex: 2; }
.btn-primary:hover { background: #09124D; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-outline { background: white; border: 1.5px solid #cbd5e1; color: #64748b; flex: 1; }
.red-btn { color: #ef4444 !important; border-color: #fecaca !important; }
.red-bg { background: #ef4444 !important; border: none; color: white; }

/* CUADRÍCULA */
.right-column { display: flex; flex-direction: column; gap: 20px; }
.qr-inline { width: auto; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cell { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; justify-content: center; }
.cell.empty { background: #f1f5f9; border: 1px dashed #cbd5e1; height: 90px; }
.cell-name { font-weight: 800; font-size: 12px; color: #09124D; margin: 0; }
.cell-sub { font-size: 10px; color: #64748b; margin-top: 4px; }
.divider { border-top: 1px dashed #e2e8f0; padding-top: 20px; }

.anniversary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.anniversary-cell {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  overflow: hidden;
  height: 100px;
}
.anniversary-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* SECCIONES INFORMES Y CONFIG */
.full-view { padding: 20px; flex: 1; }
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.stats-row { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
.stat-box { background: #1B3573; color: white; padding: 20px 30px; border-radius: 15px; display: flex; flex-direction: column; }
.stat-box.secondary { background: #f1f5f9; color: #09124D; }
.stat-box .number { font-size: 28px; font-weight: 900; }
.stat-box .label { font-size: 11px; opacity: 0.8; text-transform: uppercase; }
.stat-box.secondary .label { color: #64748b; }

.filter-select { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; min-width: 180px; }

.report-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.report-table th { text-align: left; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; }
.report-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.report-table code { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-family: monospace; }
.empty-msg { text-align: center; padding: 50px !important; color: #94a3b8; }
.text-center { text-align: center; }

.badge { padding: 4px 12px; border-radius: 15px; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; }

.actions-cell { display: flex; gap: 8px; justify-content: center; }
.action-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 6px; border-radius: 8px; transition: 0.2s; }
.action-btn:hover { background: #f1f5f9; }
.action-btn.delete:hover { background: #fee2e2; }

/* CONFIG */
.config-content { max-width: 600px; display: flex; flex-direction: column; gap: 25px; }
.config-card { padding: 20px; background: #f8fafc; border-radius: 15px; border: 1px solid #e2e8f0; }
.config-card h4 { margin: 0 0 15px; color: #09124D; }
.config-card .hint { color: #94a3b8; font-size: 12px; margin: 8px 0; }
.danger { border-color: #fee2e2; background: #fffcfc; }

.connection-status { display: flex; align-items: center; gap: 10px; padding: 10px 15px; border-radius: 10px; font-weight: 600; margin-bottom: 10px; }
.connection-status.connected { background: #d1fae5; color: #059669; }
.connection-status.disconnected { background: #fee2e2; color: #dc2626; }
.status-dot-small { width: 10px; height: 10px; border-radius: 50%; background: currentColor; }

/* MODAL */
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.warning-text { color: #dc2626; font-size: 13px; margin-top: 10px; }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .content { grid-template-columns: 1fr; }
  .input-row { grid-template-columns: 1fr; }
  .full-width { grid-column: span 1; }
}
</style>
