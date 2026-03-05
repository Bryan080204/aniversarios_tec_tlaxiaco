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
                  <button v-if="isAdmin" class="btn btn-welcome" @click="handleMenuSelect('registro')">
                    Ir al Registro ➜
                  </button>
                  <button v-else-if="!isAuthenticated" class="btn btn-welcome" @click="showLoginModal = true">
                    Iniciar Sesión ➜
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

          <!-- SOLO MOSTRAR FORMULARIO EN REGISTRO (NO EN INICIO) -->
          <div v-if="active === 'registro'" class="content">
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
                    <span>Imágenes del Aniversario</span>
                    <p class="field-hint">Sube de 3 a 6 imágenes (arrastra o haz clic para seleccionar).</p>
                    
                    <!-- Zona de Drop / Selector de archivos -->
                    <div 
                      class="upload-dropzone"
                      :class="{ 'dropzone-active': isDragging }"
                      @dragover.prevent="isDragging = true"
                      @dragleave.prevent="isDragging = false"
                      @drop.prevent="handleFileDrop"
                      @click="$refs.fileInput.click()"
                    >
                      <input 
                        ref="fileInput"
                        type="file" 
                        accept="image/*" 
                        multiple 
                        @change="handleFileSelect"
                        style="display: none;"
                      />
                      <div class="dropzone-content">
                        <span class="dropzone-icon">📁</span>
                        <span class="dropzone-text">Arrastra imágenes aquí o haz clic para seleccionar</span>
                        <span class="dropzone-hint">JPG, PNG, WEBP (máx. 10MB cada una)</span>
                      </div>
                    </div>

                    <!-- Preview de imágenes seleccionadas -->
                    <div v-if="selectedFiles.length > 0" class="images-preview-grid">
                      <div 
                        v-for="(file, index) in selectedFiles" 
                        :key="index" 
                        class="preview-item"
                      >
                        <img :src="file.preview" :alt="`Imagen ${index + 1}`" />
                        <button class="preview-remove" @click.stop="removeSelectedFile(index)">✕</button>
                        <span class="preview-name">{{ file.name }}</span>
                      </div>
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
              <section class="panel lowerRight gallery-panel">
                <div class="panel-header-inline">
                  <h3>Últimos Registros</h3>
                  <div v-if="ultimosRegistros.length > 0" class="gallery-count-badge">
                    {{ ultimosRegistros.length }} registro(s)
                  </div>
                </div>
                
                <!-- GALERÍA DE IMÁGENES (sin carrusel) -->
                <div class="gallery-grid">
                  <template v-if="galeriaImagenes.length > 0">
                    <div 
                      v-for="(img, i) in galeriaImagenes" 
                      :key="i" 
                      class="gallery-item"
                      @click="abrirImagen(img.url)"
                    >
                      <img :src="img.url" :alt="`Aniversario ${img.anio}`" />
                      <div class="gallery-item-overlay">
                        <span class="gallery-year">{{ img.anio }}</span>
                        <div v-if="isAdmin" class="gallery-actions">
                          <button @click.stop="editarImagenGaleria(img)" title="Editar">✏️</button>
                          <button @click.stop="eliminarImagenGaleria(img)" title="Eliminar">🗑️</button>
                        </div>
                      </div>
                    </div>
                  </template>
                  <div v-else class="empty-gallery-message">
                    <div class="empty-image-slot">No hay imágenes registradas</div>
                  </div>
                </div>

                <!-- Botón para agregar imagen si es admin -->
                <div v-if="isAdmin && ultimosRegistros.length > 0" class="gallery-footer">
                  <button class="btn btn-outline btn-sm" @click="abrirModalSubirImagen">
                    + Agregar Imagen
                  </button>
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
                      <th class="text-center">Imágenes</th>
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
                      <td class="text-center">
                        <div class="cell-content-wrapper">
                          <button class="btn-text-icon" @click="verImagenes(aniversario)">
                            🖼️ Ver Fotos
                          </button>
                        </div>
                      </td>
                      <td class="text-center">
                        <div class="cell-content-wrapper gap-sm">
                          <button class="action-btn edit" @click="editarAniversario(aniversario)" title="Editar">✏️</button>
                          <button class="action-btn delete" @click="confirmarEliminar(aniversario)" title="Eliminar">🗑️</button>
                        </div>
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

    <!-- MODAL GALERÍA -->
    <ModalDialog :show="showGalleryModal" :title="galleryTitle" size="large" @close="showGalleryModal = false">
      <div v-if="galleryImages.length > 0" class="gallery-container">
        <div v-for="(img, idx) in galleryImages" :key="idx" class="gallery-item">
          <img :src="img.url || img" :alt="`Foto ${idx + 1}`" @click="abrirImagen(img.url || img)" />
          <div v-if="isAdmin" class="gallery-item-actions">
            <button @click.stop="editarImagenGaleriaModal(img, idx)" class="action-mini">✏️</button>
            <button @click.stop="eliminarImagenGaleriaModal(img)" class="action-mini delete">🗑️</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-gallery">
        <p>No hay imágenes disponibles para este registro.</p>
      </div>
      <template #footer>
        <button v-if="isAdmin" class="btn btn-outline" @click="abrirModalSubirImagenGaleria">+ Agregar Imagen</button>
        <button class="btn btn-primary" @click="showGalleryModal = false">Cerrar</button>
      </template>
    </ModalDialog>

    <!-- MODAL LOGIN MEJORADO -->
    <div v-if="showLoginModal" class="login-overlay" @click.self="showLoginModal = false">
      <div class="login-modal">
        <button class="login-close" @click="showLoginModal = false">✕</button>
        
        <div class="login-content">
          <div class="login-brand">
            <img src="/logo-itt.png" alt="Logo TEC" class="login-logo" />
            <h2>Bienvenido</h2>
            <p>Sistema de Aniversarios TEC Tlaxiaco</p>
          </div>
          
          <form class="login-form" @submit.prevent="handleLogin">
            <div class="login-field">
              <label for="username">👤 Usuario</label>
              <input 
                id="username"
                v-model="loginForm.username" 
                placeholder="Ingresa tu usuario"
                autocomplete="username"
              />
            </div>
            
            <div class="login-field">
              <label for="password">🔒 Contraseña</label>
              <input 
                id="password"
                v-model="loginForm.password" 
                type="password" 
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
              />
            </div>
            
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            
            <button type="submit" class="login-submit" :disabled="isLoggingIn">
              <span v-if="isLoggingIn" class="login-spinner"></span>
              <span v-else>Iniciar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL SUBIR IMAGEN A GALERÍA -->
    <ModalDialog :show="showUploadGalleryModal" title="Subir Imagen" size="medium" @close="showUploadGalleryModal = false">
      <div class="modal-form">
        <div class="field">
          <span>Seleccionar aniversario</span>
          <select v-model="uploadGalleryAniversarioId">
            <option value="">-- Selecciona un aniversario --</option>
            <option v-for="aniv in ultimosRegistros" :key="aniv.id" :value="aniv.id">
              {{ aniv.nombre }} ({{ aniv.anio }})
            </option>
          </select>
        </div>
        <div class="field">
          <span>Imágenes</span>
          <div 
            class="upload-dropzone-mini"
            @dragover.prevent="isDraggingGallery = true"
            @dragleave.prevent="isDraggingGallery = false"
            @drop.prevent="handleGalleryFileDrop"
            @click="$refs.galleryFileInput.click()"
            :class="{ 'dropzone-active': isDraggingGallery }"
          >
            <input 
              ref="galleryFileInput"
              type="file" 
              accept="image/*" 
              multiple 
              @change="handleGalleryFileSelect"
              style="display: none;"
            />
            <span>📁 Arrastra o haz clic para seleccionar</span>
          </div>
          <div v-if="gallerySelectedFiles.length > 0" class="mini-preview-list">
            <div v-for="(file, i) in gallerySelectedFiles" :key="i" class="mini-preview">
              <img :src="file.preview" />
              <button @click="gallerySelectedFiles.splice(i, 1)">✕</button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showUploadGalleryModal = false">Cancelar</button>
        <button class="btn btn-primary" @click="subirImagenesGaleria" :disabled="isUploadingGallery">
          <LoadingSpinner v-if="isUploadingGallery" size="small" />
          <span v-else>Subir Imágenes</span>
        </button>
      </template>
    </ModalDialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarMenu from '../components/SidebarMenu.vue'
import AppHeader from '../components/AppHeader.vue'
import QrCard from '../components/QrCard.vue' 
import ValidacionView from './ValidacionView.vue'
import ToastNotification from '../components/ToastNotification.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import SearchBar from '../components/SearchBar.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { aniversariosAPI, imagenesAPI, estadisticasAPI, adminAPI, authAPI } from '../services/api.js'

const route = useRoute()
const router = useRouter()
const active = ref(route.meta.section || 'inicio')

// --- AUTENTICACIÓN ---
const isAuthenticated = ref(authAPI.isAuthenticated())
const isAdmin = ref(authAPI.isAdmin())
const currentUser = ref(authAPI.getUsuario())
const showLoginModal = ref(false)
const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const isLoggingIn = ref(false)

// --- ESTADO GLOBAL ---
const anioAniversario = ref('')
const descripcionAniversario = ref('')
const selectedFiles = ref([]) // Archivos seleccionados para subir
const isDragging = ref(false)
const urlBaseQR = ref('https://tec-tlaxiaco.mx/aniversario')
const qrFinalValue = ref('https://tec-tlaxiaco.mx/aniversario')
const estadoActual = ref(0)

// --- Variables para galería modal de subida ---
const showUploadGalleryModal = ref(false)
const uploadGalleryAniversarioId = ref(null)
const gallerySelectedFiles = ref([])
const isDraggingGallery = ref(false)
const isUploadingGallery = ref(false)
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

// --- FUNCIONES DE AUTENTICACIÓN ---
async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    loginError.value = 'Ingresa usuario y contraseña'
    return
  }
  
  isLoggingIn.value = true
  loginError.value = ''
  
  try {
    const response = await authAPI.login(loginForm.value.username, loginForm.value.password)
    authAPI.setToken(response.data.token, response.data.usuario)
    isAuthenticated.value = true
    isAdmin.value = response.data.usuario.rol === 'admin'
    currentUser.value = response.data.usuario
    showLoginModal.value = false
    loginForm.value = { username: '', password: '' }
    mostrarToast(`Bienvenido, ${response.data.usuario.nombre}`, 'success')
    await cargarDatos()
  } catch (error) {
    loginError.value = error.response?.data?.error || 'Error al iniciar sesión'
  } finally {
    isLoggingIn.value = false
  }
}

function handleLogout() {
  authAPI.logout()
  isAuthenticated.value = false
  isAdmin.value = false
  currentUser.value = null
  mostrarToast('Sesión cerrada', 'info')
}

// --- FUNCIONES DE MANEJO DE ARCHIVOS (REGISTRO) ---
function handleFileDrop(event) {
  event.preventDefault()
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer.files)
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    mostrarToast('Solo se permiten archivos de imagen', 'error')
    return
  }
  
  const totalFiles = selectedFiles.value.length + imageFiles.length
  if (totalFiles > 6) {
    mostrarToast('Máximo 6 imágenes permitidas', 'error')
    return
  }
  
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedFiles.value.push({
        file,
        preview: e.target.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    mostrarToast('Solo se permiten archivos de imagen', 'error')
    return
  }
  
  const totalFiles = selectedFiles.value.length + imageFiles.length
  if (totalFiles > 6) {
    mostrarToast('Máximo 6 imágenes permitidas', 'error')
    return
  }
  
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedFiles.value.push({
        file,
        preview: e.target.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
  
  // Limpiar el input para permitir seleccionar el mismo archivo
  event.target.value = ''
}

function removeSelectedFile(index) {
  selectedFiles.value.splice(index, 1)
}

function handleDragOver(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

// --- FUNCIONES DE GALERÍA (SUBIDA MODAL) ---
function abrirModalSubirImagen(aniversarioId) {
  uploadGalleryAniversarioId.value = aniversarioId
  gallerySelectedFiles.value = []
  showUploadGalleryModal.value = true
}

function handleGalleryFileDrop(event) {
  event.preventDefault()
  isDraggingGallery.value = false
  
  const files = Array.from(event.dataTransfer.files)
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    mostrarToast('Solo se permiten archivos de imagen', 'error')
    return
  }
  
  const totalFiles = gallerySelectedFiles.value.length + imageFiles.length
  if (totalFiles > 6) {
    mostrarToast('Máximo 6 imágenes permitidas', 'error')
    return
  }
  
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      gallerySelectedFiles.value.push({
        file,
        preview: e.target.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
}

function handleGalleryFileSelect(event) {
  const files = Array.from(event.target.files)
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    mostrarToast('Solo se permiten archivos de imagen', 'error')
    return
  }
  
  const totalFiles = gallerySelectedFiles.value.length + imageFiles.length
  if (totalFiles > 6) {
    mostrarToast('Máximo 6 imágenes permitidas', 'error')
    return
  }
  
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      gallerySelectedFiles.value.push({
        file,
        preview: e.target.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
  
  event.target.value = ''
}

function removeGalleryFile(index) {
  gallerySelectedFiles.value.splice(index, 1)
}

async function subirImagenesGaleria() {
  if (gallerySelectedFiles.value.length === 0) {
    mostrarToast('Selecciona al menos una imagen', 'error')
    return
  }
  
  isUploadingGallery.value = true
  
  try {
    const files = gallerySelectedFiles.value.map(f => f.file)
    await imagenesAPI.upload(uploadGalleryAniversarioId.value, files)
    
    showUploadGalleryModal.value = false
    gallerySelectedFiles.value = []
    mostrarToast('Imágenes subidas correctamente', 'success')
    await cargarDatos()
    await cargarImagenesGlobal()
  } catch (error) {
    mostrarToast(error.response?.data?.error || 'Error al subir imágenes', 'error')
  } finally {
    isUploadingGallery.value = false
  }
}

async function eliminarImagenGaleria(imagenId) {
  if (!confirm('¿Estás seguro de eliminar esta imagen?')) return
  
  try {
    await imagenesAPI.delete(imagenId)
    mostrarToast('Imagen eliminada correctamente', 'success')
    await cargarImagenesGlobal()
    await cargarDatos()
  } catch (error) {
    mostrarToast('Error al eliminar la imagen', 'error')
  }
}

// --- ROUTER SYNC ---
onMounted(() => {
  if (route.meta.section) {
    active.value = route.meta.section
  }
  cargarDatos()
  verificarConexion()
})

// Cargar imágenes de todos los aniversarios para el carrusel y galerías (modo fallback)
async function cargarImagenesGlobal() {
  if (!backendConnected.value) return
  try {
    const res = await imagenesAPI.getAll()
    const mapa = {}
    res.data.forEach(img => {
      if (!mapa[img.anio]) mapa[img.anio] = []
      mapa[img.anio].push(img.url)
    })
    imagenesPorAnio.value = mapa
  } catch (error) {
    console.warn('Error al cargar imágenes globales')
  }
}

watch(backendConnected, (val) => {
  if (val) cargarImagenesGlobal()
})

// Observar cambios en la ruta completa para actualizar la sección activa
watch(() => route.path, () => {
  if (route.meta.section) {
    active.value = route.meta.section
  } else if (route.path === '/') {
    active.value = 'inicio'
  }
}, { immediate: true })

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
    cargarImagenesGlobal()
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

  // Validar archivos seleccionados en lugar de URLs
  if (selectedFiles.value.length < 3 || selectedFiles.value.length > 6) {
    mostrarToast('Debes seleccionar entre 3 y 6 imágenes', 'error')
    return
  }

  const yaExisteAnio = listaAniversarios.value.some(a => String(a.anio) === anioAniversario.value)
  if (yaExisteAnio) {
    mostrarToast('Ese año ya está registrado.', 'error')
    return
  }

  const nombreGenerado = `Aniversario ${anioAniversario.value}`

  isLoading.value = true

  try {
    if (backendConnected.value) {
      // Primero crear el aniversario
      const response = await aniversariosAPI.create({
        nombre: nombreGenerado,
        anio: parseInt(anioAniversario.value),
        descripcion: descripcionAniversario.value.trim()
      })
      
      // Luego subir las imágenes
      const aniversarioId = response.data.id
      const files = selectedFiles.value.map(f => f.file)
      await imagenesAPI.upload(aniversarioId, files)
      
      await cargarDatos()
      await cargarImagenesGlobal()
    } else {
      // Modo local (demo)
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
  selectedFiles.value = []
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

// --- CARRUSEL DINÁMICO ---
const currentCarouselIndex = ref(0)
const carouselData = computed(() => {
  if (listaAniversarios.value.length === 0) return []
  
  // Tomamos los últimos 3 registros (o menos si hay pocos)
  const ultimos = listaAniversarios.value.slice(0, 3)
  const allImages = []
  
  ultimos.forEach(aniv => {
    const images = imagenesPorAnio.value[aniv.anio] || []
    images.forEach(url => {
      allImages.push({ url, anio: aniv.anio })
    })
  })
  
  return allImages
})

const carouselImages = computed(() => carouselData.value.map(d => d.url))

const carouselYear = computed(() => {
  if (carouselData.value.length === 0) return ''
  return carouselData.value[currentCarouselIndex.value]?.anio || ''
})

function nextCarousel() {
  if (carouselImages.value.length <= 1) return
  currentCarouselIndex.value = (currentCarouselIndex.value + 1) % carouselImages.value.length
}

function prevCarousel() {
  if (carouselImages.value.length <= 1) return
  currentCarouselIndex.value = (currentCarouselIndex.value - 1 + carouselImages.value.length) % carouselImages.value.length
}

let carouselInterval = null
onMounted(() => {
  carouselInterval = setInterval(nextCarousel, 5000)
})

// --- GALERÍA MODAL ---
const showGalleryModal = ref(false)
const galleryImages = ref([])
const galleryTitle = ref('')

async function verImagenes(aniversario) {
  galleryTitle.value = `Fotos de ${aniversario.nombre}`
  isLoading.value = true
  try {
    if (backendConnected.value) {
      const res = await imagenesAPI.getByAniversario(aniversario.id)
      galleryImages.value = res.data.map(i => i.url)
    } else {
      galleryImages.value = imagenesPorAnio.value[aniversario.anio] || []
    }
    showGalleryModal.value = true
  } catch (error) {
    mostrarToast('Error al cargar imágenes', 'error')
  } finally {
    isLoading.value = false
  }
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

.report-table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
.report-table th { text-align: left; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; }
.report-table th.text-center { text-align: center; }
.report-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
.report-table code { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-family: monospace; }

.cell-content-wrapper { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  min-height: 40px;
}
.gap-sm { gap: 15px; }

.empty-msg { text-align: center; padding: 50px !important; color: #94a3b8; }
.text-center { text-align: center; }

.badge { padding: 4px 12px; border-radius: 15px; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; }

.action-btn { background: none; border: none; cursor: pointer; font-size: 20px; padding: 6px; border-radius: 8px; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
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
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

/* CARRUSEL */
.carousel-panel {
  display: flex;
  flex-direction: column;
}
.panel-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.carousel-year-badge {
  background: #1b3573;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
}
.carousel-container {
  flex: 1;
  min-height: 250px;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}
.carousel-viewport {
  width: 100%;
  height: 100%;
  position: relative;
}
.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.carousel-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  pointer-events: none;
}
.carousel-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  color: #09124D;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transition: 0.2s;
}
.carousel-btn:hover {
  background: white;
  transform: scale(1.1);
}
.carousel-indicators {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}
.indicator.active {
  background: white;
  width: 20px;
  border-radius: 4px;
}
.empty-carousel {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* GALERÍA */
.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  padding: 10px 0;
}
.gallery-item {
  border-radius: 12px;
  overflow: hidden;
  height: 150px;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s;
}
.gallery-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.empty-gallery {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.btn-text-icon {
  background: #f0f7ff;
  border: 1px solid #dbeafe;
  color: #1b3573;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}
.btn-text-icon:hover {
  background: #dbeafe;
  transform: scale(1.02);
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

/* ========== MODAL DE LOGIN MEJORADO ========== */
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.login-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 380px;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: loginSlideIn 0.3s ease-out;
}

@keyframes loginSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  color: #64748b;
  transition: 0.2s;
  z-index: 10;
}

.login-close:hover {
  background: #fee2e2;
  color: #dc2626;
}

.login-content {
  padding: 32px 28px;
}

.login-brand {
  text-align: center;
  margin-bottom: 28px;
}

.login-brand .login-logo {
  width: 70px;
  height: 70px;
  object-fit: contain;
  margin-bottom: 12px;
}

.login-brand h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #0f172a;
  font-weight: 800;
}

.login-brand p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-field label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.login-field input {
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
  background: #f8fafc;
}

.login-field input:focus {
  border-color: #1B3573;
  background: white;
  box-shadow: 0 0 0 3px rgba(27, 53, 115, 0.1);
}

.login-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin: 0;
}

.login-submit {
  background: linear-gradient(135deg, #1B3573 0%, #09124D 100%);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.login-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(27, 53, 115, 0.3);
}

.login-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.login-hint {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
  text-align: center;
}

.login-hint p {
  margin: 0 0 6px;
  font-size: 11px;
  color: #94a3b8;
}

.login-hint code {
  font-size: 12px;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  color: #475569;
}

/* Responsive para móviles */
@media (max-width: 480px) {
  .login-modal {
    max-width: 100%;
    margin: 0 8px;
    border-radius: 16px;
  }
  
  .login-content {
    padding: 24px 20px;
  }
  
  .login-brand .login-logo {
    width: 60px;
    height: 60px;
  }
  
  .login-brand h2 {
    font-size: 1.3rem;
  }
}

/* ========== ESTILOS DE USUARIO AUTENTICADO ========== */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  background: #f0f7ff;
  color: #1b3573;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.btn-logout {
  background: #ef4444;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
}

/* ========== ESTILOS DE UPLOAD ========== */
.upload-section {
  margin-top: 10px;
}

.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8fafc;
}

.upload-dropzone:hover,
.upload-dropzone.dragging {
  border-color: #1b3573;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.upload-text {
  font-weight: 700;
  color: #334155;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #64748b;
}

.upload-input {
  display: none;
}

/* Vista previa de archivos seleccionados */
.selected-files {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.file-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: #f1f5f9;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-preview .remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.file-preview .remove-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.file-preview .file-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== ESTILOS DE GALERÍA ========== */
.gallery-section {
  margin-top: 20px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.gallery-header h4 {
  margin: 0;
  color: #09124D;
  font-weight: 700;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.gallery-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: #f1f5f9;
  cursor: pointer;
  transition: transform 0.2s;
}

.gallery-item:hover {
  transform: scale(1.03);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-item .gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  opacity: 0;
  transition: 0.3s;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 10px;
  gap: 8px;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-overlay button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.gallery-overlay .btn-view {
  background: white;
  color: #334155;
}

.gallery-overlay .btn-delete {
  background: #ef4444;
  color: white;
}

.gallery-overlay button:hover {
  transform: scale(1.05);
}

.gallery-year-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(27, 53, 115, 0.9);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.empty-gallery {
  grid-column: span 3;
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-gallery-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* ========== MODAL DE GALERÍA DE SUBIDA ========== */
.gallery-upload-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gallery-upload-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .selected-files,
  .gallery-grid,
  .gallery-upload-preview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .empty-gallery {
    grid-column: span 2;
  }
}
</style>
