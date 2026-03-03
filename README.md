# 🎓 Sistema de Registro - TEC Tlaxiaco

Sistema de registro y control de alumnos para eventos del Instituto Tecnológico de Tlaxiaco.

## 📁 Estructura del Proyecto

```
aniversarios_tec_tlaxiaco/
├── frontend/          # Vue.js 3 + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── services/
│   │   └── router/
│   └── package.json
│
├── backend/           # Node.js + Express + PostgreSQL
│   ├── index.js       # Servidor principal
│   ├── database.js    # Conexión a PostgreSQL
│   ├── .env           # Variables de entorno
│   └── package.json
│
└── README.md
```

---

## 🚀 Instalación

### 1. Configurar Base de Datos (pgAdmin)

Crear una base de datos llamada `tec_tlaxiaco_db` y ejecutar:

```sql
-- Tabla de alumnos
CREATE TABLE alumnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    numero_control VARCHAR(20) UNIQUE NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    estado INTEGER DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de eventos
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    año INTEGER NOT NULL,
    estado INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de ejemplo
INSERT INTO alumnos (nombre, numero_control, carrera, estado) VALUES
('María González López', '20730001', 'Sistemas', 2),
('Juan Pérez Martínez', '20730002', 'Civil', 1),
('Ana Rodríguez Sánchez', '20730003', 'Gestion', 0);

INSERT INTO eventos (nombre, descripcion, año, estado) VALUES
('Aniversario 25', 'Celebración del 25 aniversario', 2026, 2),
('Feria Tecnológica', 'Exposición de proyectos', 2026, 1);
```

### 2. Configurar Variables de Entorno

Editar `backend/.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=tec_tlaxiaco_db
PORT=3001
```

### 3. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Ejecutar el Proyecto

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🌐 URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/api/health |

---

## 📡 API Endpoints

### Alumnos
- `GET /api/alumnos` - Listar alumnos
- `GET /api/alumnos/:id` - Obtener alumno
- `POST /api/alumnos` - Crear alumno
- `PUT /api/alumnos/:id` - Actualizar alumno
- `DELETE /api/alumnos/:id` - Eliminar alumno

### Eventos
- `GET /api/eventos` - Listar eventos
- `POST /api/eventos` - Crear evento
- `PUT /api/eventos/:id/estado` - Actualizar estado

### Estadísticas
- `GET /api/estadisticas` - Obtener estadísticas

### Validación
- `GET /api/validacion/registros` - Obtener registros
- `PUT /api/validacion/:tipo/:id/estado` - Actualizar estado

---

## 🛠️ Tecnologías

- **Frontend**: Vue.js 3, Vite, Vue Router, Axios
- **Backend**: Node.js, Express, pg (PostgreSQL)
- **Base de datos**: PostgreSQL

---

## 👤 Autor

Instituto Tecnológico de Tlaxiaco - 2026
