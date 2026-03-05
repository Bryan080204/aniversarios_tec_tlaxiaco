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
         <transition name="fade-slide" appear>
            <section v-if="active === 'inicio'" class="welcome-hero">
              <div class="welcome-content">
                <div class="welcome-badge">Panel de Administración</div>
                <h1>Bienvenido al Sistema de <span class="text-gradient">Aniversarios</span></h1>
                <p class="welcome-text">
                  Gestiona la historia y los momentos más emblemáticos del Instituto Tecnológico de Tlaxiaco. 
                  Registra eventos, valida estados y genera códigos QR institucionales.
                </p>
                <div class="welcome-actions">
                  <button class="btn btn-welcome" @click="handleMenuSelect('registro')">
                    Ir al Registro ➜
                  </button>
                  <div class="welcome-stats-mini">
                    <div class="mini-stat">
                      <span class="num text-green">{{ inicioCounts.validado }}</span>
                      <span class="lab">Validados</span>
                    </div>
                    <div class="separator"></div>
                    <div class="mini-stat">
                      <span class="num text-red">{{ inicioCounts.pendiente }}</span>
                      <span class="lab">Pendientes</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="welcome-visual">
                <img src="/logo-itt.png" alt="Logo ITT" class="floating-logo" />
              </div>
            </section>
          </transition>

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
                    <div class="year-combobox" @keydown.esc="showYearMenu = false">
                      <input 
                        v-model="anioAniversario" 
                        @input="validarAnio"
                        @focus="showYearMenu = true"
                        @blur="cerrarMenuAniosConDelay"
                        placeholder="Escribe o selecciona"
                        maxlength="4"
                      />
                      <button class="year-toggle" type="button" @mousedown.prevent @click="toggleYearMenu">▾</button>
                      <div v-if="showYearMenu" class="year-dropdown">
                        <button
                          v-for="anio in filteredYearOptions"
                          :key="anio"
                          type="button"
                          class="year-option"
                          @mousedown.prevent
                          @click="seleccionarAnio(anio)"
                        >
                          {{ anio }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="field full-width">
                    <span>Descripción</span>
                    <input
                      v-model="descripcionAniversario"
                      placeholder="Ej: Celebración del aniversario institucional"
                    />
                  </div>
                  <div class="field full-width">
                    <span>URLs de imágenes</span>
                    <p class="field-hint">Ingresa de 3 a 6 imágenes (una URL por campo).</p>
                    <div class="images-url-grid">
                      <input v-for="(_, index) in urlImagenesForm" :key="index" v-model="urlImagenesForm[index]" :placeholder="`Imagen ${index + 1}: https://...`" />
                    </div>
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
                  <div
                    class="anniversary-cell"
                    v-for="(imagen, index) in imagenesAniversario"
                    :key="index"
                    @mouseleave="cerrarMenuImagen"
                  >
                    <img
                      v-if="imagen"
                      :src="imagen"
                      :alt="`Aniversario ${index + 1}`"
                      @click="abrirImagen(imagen)"
                    />
                    <div v-else class="empty-image-slot">Sin imagen</div>
                    <button class="image-menu-trigger" @click.stop="toggleMenu(index)">⋯</button>
                    <div v-if="activeImageMenu === index" class="image-menu" @mouseleave="cerrarMenuImagen">
                      <button @click.stop="eliminarImagen(index)">Eliminar</button>
                      <button @click.stop="abrirEditorImagen(index, 'edit')">Editar</button>
                      <button @click.stop="abrirEditorImagen(index, 'add')">Agregar</button>
                    </div>
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
                  <span class="number">{{ estadisticas.totalAniversarios || listaAniversarios.length }}</span>
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
                    <tr v-for="aniversario in aniversariosFiltrados" :key="aniversario.id">
                      <td>{{ aniversario.nombre }}</td>
                      <td><code>{{ aniversario.anio }}</code></td>
                      <td>{{ aniversario.descripcion }}</td>
                      <td>
                        <span class="badge" :class="getBadgeClass(aniversario.estado)">
                          {{ getEstadoText(aniversario.estado) }}
                        </span>
                      </td>
                      <td class="text-center actions-cell">
                        <button class="action-btn edit" @click="editarAniversario(aniversario)" title="Editar">✏️</button>
                        <button class="action-btn delete" @click="confirmarEliminar(aniversario)" title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                    <tr v-if="aniversariosFiltrados.length === 0">
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
    <ModalDialog :show="showEditModal" title="Editar Registro de Aniversario" @close="showEditModal = false">
      <div class="modal-form">
        <div class="field">
          <span>Año de aniversario</span>
          <input v-model="editForm.anio" maxlength="4" @input="editForm.anio = String(editForm.anio || '').replace(/\D/g, '').slice(0,4)" />
        </div>
        <div class="field">
          <span>Descripción</span>
          <input v-model="editForm.descripcion" />
        </div>
        <div class="field">
          <span>URL de imagen</span>
          <input v-model="editForm.imagenUrl" placeholder="https://..." />
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
      <p>¿Estás seguro de que deseas eliminar <strong>{{ aniversarioAEliminar?.nombre }}</strong>?</p>
      <p class="warning-text">Esta acción no se puede deshacer.</p>
      <template #footer>
        <button class="btn btn-outline" @click="showDeleteModal = false">Cancelar</button>
        <button class="btn btn-primary red-bg" @click="eliminarAniversario">Eliminar</button>
      </template>
    </ModalDialog>

    <div v-if="previewImageUrl" class="image-preview-overlay" @click="cerrarPreviewImagen">
      <div class="image-preview-content" @click.stop>
        <button class="preview-close" @click="cerrarPreviewImagen">✕</button>
        <img :src="previewImageUrl" alt="Vista previa de aniversario" />
      </div>
    </div>

    <ModalDialog
      :show="showImageEditorModal"
      :title="imageEditorMode === 'edit' ? 'Editar Imagen' : 'Agregar Imagen'"
      size="small"
      @close="showImageEditorModal = false"
    >
      <div class="modal-form">
        <div class="field">
          <span>URL de la imagen</span>
          <input v-model="imageEditorUrl" placeholder="https://..." />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showImageEditorModal = false">Cancelar</button>
        <button class="btn btn-primary" @click="guardarImagenEditor">Guardar</button>
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
import { aniversariosAPI, imagenesAPI, estadisticasAPI, adminAPI } from '../services/api.js'

const route = useRoute()
const router = useRouter()
const active = ref(route.meta.section || 'inicio')

// --- ESTADO GLOBAL ---
const anioAniversario = ref('')
const descripcionAniversario = ref('')
const urlImagenesForm = ref(['', '', '', '', '', ''])
const urlBaseQR = ref('https://tec-tlaxiaco.mx/aniversario')
const qrFinalValue = ref('https://tec-tlaxiaco.mx/aniversario')
const estadoActual = ref(0)
const listaAniversarios = ref([])
const estadisticas = ref({})
const backendConnected = ref(false)

// --- ESTADOS DE UI ---
const isLoading = ref(false)
const isLoadingList = ref(false)
const busqueda = ref('')
const filtroEstado = ref('')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showImageEditorModal = ref(false)
const editForm = ref({})
const aniversarioAEliminar = ref(null)
const activeImageMenu = ref(null)
const previewImageUrl = ref('')
const showYearMenu = ref(false)
const imagenesPorAnio = ref({})
const imageEditorMode = ref('edit')
const imageEditorIndex = ref(-1)
const imageEditorUrl = ref('')
const demoRegistros = [
  {
    id: 'demo-2026',
    nombre: 'Aniversario 2026',
    numero_control: '20260001',
    carrera: 'Celebración institucional del TEC Tlaxiaco',
    estado: 2
  },
  {
    id: 'demo-2025',
    nombre: 'Aniversario 2025',
    numero_control: '20250001',
    carrera: 'Feria tecnológica y actividades académicas',
    estado: 1
  },
  {
    id: 'demo-2024',
    nombre: 'Aniversario 2024',
    numero_control: '20240001',
    carrera: 'Evento cultural y deportivo',
    estado: 0
  }
]
const imagenesAniversario = ref([
  'https://picsum.photos/seed/aniversario-1/500/320',
  'https://picsum.photos/seed/aniversario-2/500/320',
  'https://picsum.photos/seed/aniversario-3/500/320',
  'https://picsum.photos/seed/aniversario-4/500/320',
  'https://picsum.photos/seed/aniversario-5/500/320',
  'https://picsum.photos/seed/aniversario-6/500/320'
])

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
    const [aniversariosRes, statsRes] = await Promise.all([
      aniversariosAPI.getAll(),
      estadisticasAPI.get()
    ])
    listaAniversarios.value = aniversariosRes.data
    estadisticas.value = statsRes.data
    backendConnected.value = true
  } catch (error) {
    console.warn('Backend no disponible, usando modo local')
    backendConnected.value = false
    cargarDatosDemo()
  } finally {
    isLoadingList.value = false
  }
}

function cargarDatosDemo() {
  listaAniversarios.value = [...demoRegistros]
  estadisticas.value = {
    totalAniversarios: demoRegistros.length,
    totalEventos: 0,
    totalImagenes: 0,
    porAnio: [],
    porEstado: [
      { estado: 0, cantidad: demoRegistros.filter(item => item.estado === 0).length },
      { estado: 1, cantidad: demoRegistros.filter(item => item.estado === 1).length },
      { estado: 2, cantidad: demoRegistros.filter(item => item.estado === 2).length }
    ]
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

const inicioCounts = computed(() => {
  return {
    pendiente: listaAniversarios.value.filter(r => r.estado === 0).length,
    proceso: listaAniversarios.value.filter(r => r.estado === 1).length,
    validado: listaAniversarios.value.filter(r => r.estado === 2).length,
  }
})

const listaAniosRegistro = computed(() => {
  const actual = new Date().getFullYear()
  return Array.from({ length: actual - 1991 + 1 }, (_, i) => String(1991 + i))
})

const filteredYearOptions = computed(() => {
  if (!anioAniversario.value) return listaAniosRegistro.value
  return listaAniosRegistro.value.filter(anio => anio.includes(anioAniversario.value))
})

// --- FILTROS ---
const aniversariosFiltrados = computed(() => {
  let resultado = listaAniversarios.value
  
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    resultado = resultado.filter(a => 
      a.nombre.toLowerCase().includes(term) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(term)) ||
      String(a.anio).includes(term)
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
  showYearMenu.value = true
}

function seleccionarAnio(valor) {
  if (!valor) return
  anioAniversario.value = valor
  showYearMenu.value = false
}

function toggleYearMenu() {
  showYearMenu.value = !showYearMenu.value
}

function cerrarMenuAniosConDelay() {
  setTimeout(() => {
    showYearMenu.value = false
  }, 150)
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

  const urlsCapturadas = urlImagenesForm.value.map(url => url.trim()).filter(Boolean)

  if (urlsCapturadas.length < 3 || urlsCapturadas.length > 6) {
    mostrarToast('Debes ingresar entre 3 y 6 URLs de imágenes', 'error')
    return
  }

  const yaExisteAnio = listaAniversarios.value.some(a => String(a.anio) === anioAniversario.value)
  if (yaExisteAnio) {
    mostrarToast('Solo se permite una imagen por año. Ese año ya está registrado.', 'error')
    return
  }

  const nombreGenerado = `Aniversario ${anioAniversario.value}`

  isLoading.value = true

  try {
    // Guardar en backend
    if (backendConnected.value) {
      await aniversariosAPI.create({
        nombre: nombreGenerado,
        anio: parseInt(anioAniversario.value),
        descripcion: descripcionAniversario.value.trim(),
        imagenes: urlsCapturadas
      })
      await cargarDatos()
    } else {
      // Modo local
      listaAniversarios.value.unshift({
        id: Date.now(),
        nombre: nombreGenerado,
        anio: parseInt(anioAniversario.value),
        descripcion: descripcionAniversario.value.trim(),
        estado: 0
      })
    }

    // Generación del texto para el QR
    const dataString = `${urlBaseQR.value}/${anioAniversario.value}?descripcion=${encodeURIComponent(descripcionAniversario.value.trim())}`
    qrFinalValue.value = dataString
    aplicarUrlsImagenesDesdeFormulario(anioAniversario.value)
    estadoActual.value = 2
    
    mostrarToast('Registro de aniversario generado correctamente', 'success')
    limpiarFormulario()
  } catch (error) {
    mostrarToast(error.response?.data?.error || 'Error al registrar', 'error')
  } finally {
    isLoading.value = false
  }
}

function limpiarFormulario() {
  anioAniversario.value = ''
  descripcionAniversario.value = ''
  urlImagenesForm.value = ['', '', '', '', '', '']
  urlBaseQR.value = 'https://tec-tlaxiaco.mx/aniversario'
  qrFinalValue.value = 'https://tec-tlaxiaco.mx/aniversario'
  estadoActual.value = 0
}

// --- EDITAR / ELIMINAR ---
function editarAniversario(aniversario) {
  editForm.value = {
    id: aniversario.id,
    estado: aniversario.estado,
    anio: aniversario.anio,
    descripcion: aniversario.descripcion,
    imagenUrl: imagenesPorAnio.value[aniversario.anio] || ''
  }
  showEditModal.value = true
}

async function guardarEdicion() {
  if (!editForm.value.anio || String(editForm.value.anio).length !== 4) {
    mostrarToast('El año debe tener 4 dígitos', 'error')
    return
  }

  if (!String(editForm.value.descripcion || '').trim()) {
    mostrarToast('La descripción es obligatoria', 'error')
    return
  }

  const payload = {
    nombre: `Aniversario ${editForm.value.anio}`,
    anio: parseInt(editForm.value.anio),
    descripcion: editForm.value.descripcion,
    estado: editForm.value.estado,
  }

  try {
    if (backendConnected.value) {
      await aniversariosAPI.update(editForm.value.id, payload)
      await cargarDatos()
    } else {
      const index = listaAniversarios.value.findIndex(a => a.id === editForm.value.id)
      if (index !== -1) {
        listaAniversarios.value[index] = { ...listaAniversarios.value[index], ...payload }
      }
    }

    if (String(editForm.value.imagenUrl || '').trim()) {
      imagenesPorAnio.value[editForm.value.anio] = editForm.value.imagenUrl.trim()
      refrescarImagenesDesdeMapa()
    }

    showEditModal.value = false
    mostrarToast('Registro actualizado correctamente', 'success')
  } catch (error) {
    mostrarToast('Error al actualizar', 'error')
  }
}

function confirmarEliminar(aniversario) {
  aniversarioAEliminar.value = aniversario
  showDeleteModal.value = true
}

async function eliminarAniversario() {
  try {
    if (backendConnected.value) {
      await aniversariosAPI.delete(aniversarioAEliminar.value.id)
      await cargarDatos()
    } else {
      listaAniversarios.value = listaAniversarios.value.filter(a => a.id !== aniversarioAEliminar.value.id)
    }
    showDeleteModal.value = false
    mostrarToast('Aniversario eliminado correctamente', 'success')
  } catch (error) {
    mostrarToast('Error al eliminar', 'error')
  }
}

async function confirmarVaciar() {
  if (confirm('¿Estás seguro de vaciar TODA la base de datos?')) {
    try {
      if (backendConnected.value) {
        await adminAPI.vaciarBD()
        await cargarDatos()
      } else {
        listaAniversarios.value = []
      }
      mostrarToast('Base de datos vaciada', 'warning')
    } catch (error) {
      mostrarToast('Error al vaciar la base de datos', 'error')
    }
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

function abrirImagen(url) {
  if (!url) return
  previewImageUrl.value = url
}

function cerrarPreviewImagen() {
  previewImageUrl.value = ''
}

function toggleMenu(index) {
  activeImageMenu.value = activeImageMenu.value === index ? null : index
}

function cerrarMenuImagen() {
  activeImageMenu.value = null
}

function aplicarUrlsImagenesDesdeFormulario(anio) {
  const urls = urlImagenesForm.value.map(url => url.trim()).filter(Boolean)

  if (urls.length === 0) return

  imagenesPorAnio.value[anio] = urls[0]

  const base = Array(6).fill('')
  urls.slice(0, 6).forEach((url, index) => {
    base[index] = url
  })
  imagenesAniversario.value = base
}

function refrescarImagenesDesdeMapa() {
  const urls = Object.values(imagenesPorAnio.value)
  const base = Array(6).fill('')
  urls.slice(0, 6).forEach((url, index) => {
    base[index] = url
  })
  imagenesAniversario.value = base
}

function eliminarImagen(index) {
  imagenesAniversario.value[index] = ''
  activeImageMenu.value = null
}

function abrirEditorImagen(index, mode) {
  imageEditorIndex.value = index
  imageEditorMode.value = mode
  imageEditorUrl.value = mode === 'edit' ? (imagenesAniversario.value[index] || '') : ''
  showImageEditorModal.value = true
  activeImageMenu.value = null
}

function guardarImagenEditor() {
  if (!imageEditorUrl.value.trim()) {
    mostrarToast('Debes ingresar una URL de imagen válida', 'error')
    return
  }

  imagenesAniversario.value[imageEditorIndex.value] = imageEditorUrl.value.trim()
  showImageEditorModal.value = false
  mostrarToast(
    imageEditorMode.value === 'edit' ? 'Imagen actualizada correctamente' : 'Imagen agregada correctamente',
    'success'
  )
}

function exportarCSV() {
  const headers = ['Registro', 'Año', 'Descripción', 'Estado']
  const rows = aniversariosFiltrados.value.map(a => [
    a.nombre,
    a.anio,
    a.descripcion,
    getEstadoText(a.estado)
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `aniversarios_tec_tlaxiaco_${new Date().toISOString().split('T')[0]}.csv`
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

.validation-preview { padding: 16px 22px 14px; border-bottom: 1px solid #d9dde6; }
.validation-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.validation-header h2 { margin: 0; color: #09124D; font-size: 2rem; font-weight: 800; }
.validation-logo { height: 52px; width: auto; }
.summary-cards { display: flex; gap: 14px; }
.card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  border-bottom-width: 4px;
  flex: 1;
  min-height: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.count { font-size: 1.9rem; font-weight: 800; line-height: 1; margin-bottom: 8px; }
.label { color: #3a4567; font-size: 1.05rem; font-weight: 700; }
.border-red { border-bottom-color: #EF4444; }
.border-yellow { border-bottom-color: #F59E0B; }
.border-green { border-bottom-color: #10B981; }
.text-red { color: #EF4444; }
.text-yellow { color: #F59E0B; }
.text-green { color: #10B981; }

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
.field-hint { margin: -2px 0 2px; font-size: 12px; color: #64748b; }
.full-width { grid-column: span 2; }
input, select { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; background: #f8fafc; width: 100%; box-sizing: border-box; }
input:focus, select:focus { border-color: #1B3573; background: white; box-shadow: 0 0 0 3px rgba(27,53,115,0.1); }
.images-url-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.year-combobox { position: relative; display: flex; align-items: center; }
.year-combobox input { padding-right: 44px; }
.year-toggle {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  cursor: pointer;
}
.year-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 190px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  z-index: 30;
}
.year-option {
  width: 100%;
  border: none;
  background: #fff;
  text-align: left;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
}
.year-option:hover { background: #f1f5f9; }

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
  position: relative;
}
.anniversary-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}
.empty-image-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  background: #eef2f7;
}
.image-menu-trigger {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(9, 18, 77, 0.8);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  display: none;
  cursor: pointer;
}
.anniversary-cell:hover .image-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.image-menu {
  position: absolute;
  top: 36px;
  right: 8px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  overflow: hidden;
  min-width: 95px;
  z-index: 20;
}
.image-menu button {
  width: 100%;
  border: none;
  background: #fff;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
}
.image-menu button:hover {
  background: #f1f5f9;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 20px;
}
.image-preview-content {
  position: relative;
  max-width: 900px;
  max-height: 85vh;
  width: 100%;
  background: #fff;
  border-radius: 14px;
  padding: 10px;
}
.image-preview-content img {
  width: 100%;
  max-height: calc(85vh - 20px);
  object-fit: contain;
  border-radius: 10px;
  display: block;
}
.preview-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(9, 18, 77, 0.9);
  color: #fff;
  cursor: pointer;
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
  .images-url-grid { grid-template-columns: 1fr; }
  .validation-header h2 { font-size: 2rem; }
  .summary-cards { flex-direction: column; }
  .year-dropdown { max-height: 160px; }
}
/* --- ESTILOS DE BIENVENIDA --- */
.text-gradient {
  background: linear-gradient(135deg, #1b3573 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

.welcome-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80px 60px;
  background: white;
  margin: 30px;
  border-radius: 30px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.03);
  border: 1px solid #eef2f6;
  position: relative;
  overflow: hidden;
}

.welcome-badge {
  background: #f0f7ff;
  color: #1b3573;
  padding: 6px 15px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 25px;
  display: inline-block;
}

.welcome-content h1 {
  font-size: 3.2rem;
  color: #0f172a;
  line-height: 1.1;
  margin-bottom: 20px;
  font-weight: 800;
}

.welcome-text {
  font-size: 1.15rem;
  color: #64748b;
  max-width: 520px;
  margin-bottom: 40px;
  line-height: 1.6;
}

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 40px;
}

.btn-welcome {
  background: #1b3573;
  color: white;
  padding: 18px 35px;
  border-radius: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 20px rgba(27,53,115,0.2);
}

.btn-welcome:hover {
  transform: translateY(-3px);
  background: #152a5c;
  box-shadow: 0 12px 25px rgba(27,53,115,0.3);
}

.welcome-stats-mini { display: flex; align-items: center; gap: 20px; }
.mini-stat { display: flex; flex-direction: column; }
.mini-stat .num { font-size: 1.6rem; font-weight: 800; }
.mini-stat .lab { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
.separator { width: 1px; height: 35px; background: #e2e8f0; }

.floating-logo {
  height: 250px;
  filter: drop-shadow(0 15px 25px rgba(0,0,0,0.1));
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Animación de entrada */
.fade-slide-enter-active {
  transition: all 0.5s ease-out;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
