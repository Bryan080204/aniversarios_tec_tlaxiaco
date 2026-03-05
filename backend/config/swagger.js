/**
 * Configuración de Swagger/OpenAPI para documentación de la API
 * Sistema de Aniversarios TEC Tlaxiaco
 */

import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Sistema de Aniversarios - TEC Tlaxiaco',
    version: '2.0.0',
    description: `
API RESTful para el Sistema de Gestión de Aniversarios del Instituto Tecnológico de Tlaxiaco.

## Características principales:
- **Autenticación** con JWT y sistema de roles (admin/usuario)
- **Gestión de Aniversarios** - CRUD completo
- **Subida de Imágenes** - Galería de fotos por aniversario
- **Validación de Registros** - Sistema de estados
- **Reportes y Estadísticas**

## Roles del sistema:
- **admin**: Acceso completo (crear, editar, eliminar, validar, configuración)
- **usuario**: Solo lectura (ver galería y registros públicos validados)
    `,
    contact: {
      name: 'TEC Tlaxiaco - Soporte',
      email: 'soporte@tec-tlaxiaco.mx'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Servidor de desarrollo'
    },
    {
      url: 'https://api.tec-tlaxiaco.mx',
      description: 'Servidor de producción'
    }
  ],
  tags: [
    { name: 'Autenticación', description: 'Endpoints de login, logout y gestión de sesiones' },
    { name: 'Usuarios', description: 'Gestión de usuarios del sistema (solo admin)' },
    { name: 'Aniversarios', description: 'CRUD de registros de aniversarios' },
    { name: 'Imágenes', description: 'Subida y gestión de imágenes de aniversarios' },
    { name: 'Eventos', description: 'Gestión de eventos especiales' },
    { name: 'Validación', description: 'Validación de registros pendientes' },
    { name: 'Estadísticas', description: 'Reportes y métricas del sistema' },
    { name: 'Administración', description: 'Operaciones de mantenimiento (solo admin)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del endpoint /api/auth/login'
      }
    },
    schemas: {
      // ========== AUTENTICACIÓN ==========
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          usuario: { $ref: '#/components/schemas/Usuario' }
        }
      },

      // ========== USUARIO ==========
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'admin' },
          nombre_completo: { type: 'string', example: 'Administrador' },
          email: { type: 'string', example: 'admin@tec-tlaxiaco.mx' },
          rol: { type: 'string', enum: ['admin', 'usuario'], example: 'admin' },
          activo: { type: 'boolean', example: true },
          ultimo_acceso: { type: 'string', format: 'date-time' },
          fecha_creacion: { type: 'string', format: 'date-time' }
        }
      },
      CrearUsuarioRequest: {
        type: 'object',
        required: ['username', 'password', 'nombre_completo', 'rol'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50, example: 'nuevo_usuario' },
          password: { type: 'string', minLength: 6, example: 'contraseña123' },
          nombre_completo: { type: 'string', example: 'Juan Pérez García' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          rol: { type: 'string', enum: ['admin', 'usuario'], example: 'usuario' }
        }
      },

      // ========== ANIVERSARIO ==========
      Aniversario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Aniversario 2024' },
          anio: { type: 'integer', example: 2024 },
          descripcion: { type: 'string', example: 'Celebración del 30 aniversario del TEC' },
          estado: { 
            type: 'integer', 
            enum: [0, 1, 2], 
            description: '0=Sin Validar, 1=En Proceso, 2=Validado',
            example: 2 
          },
          creado_por: { type: 'integer', example: 1 },
          validado_por: { type: 'integer', nullable: true },
          fecha_validacion: { type: 'string', format: 'date-time', nullable: true },
          fecha_registro: { type: 'string', format: 'date-time' },
          fecha_actualizacion: { type: 'string', format: 'date-time' },
          imagenes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Imagen' }
          }
        }
      },
      CrearAniversarioRequest: {
        type: 'object',
        required: ['anio', 'descripcion'],
        properties: {
          anio: { type: 'integer', minimum: 1990, maximum: 2100, example: 2024 },
          descripcion: { type: 'string', example: 'Descripción del aniversario' }
        }
      },

      // ========== IMAGEN ==========
      Imagen: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          aniversario_id: { type: 'integer', example: 1 },
          nombre_archivo: { type: 'string', example: 'abc123-1709654321.jpg' },
          nombre_original: { type: 'string', example: 'foto_aniversario.jpg' },
          ruta_archivo: { type: 'string', example: '/uploads/2024/abc123-1709654321.jpg' },
          tipo_mime: { type: 'string', example: 'image/jpeg' },
          tamano_bytes: { type: 'integer', example: 204800 },
          orden: { type: 'integer', example: 0 },
          descripcion: { type: 'string', example: 'Foto del evento principal' },
          fecha_creacion: { type: 'string', format: 'date-time' }
        }
      },

      // ========== EVENTO ==========
      Evento: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Feria Tecnológica' },
          descripcion: { type: 'string', example: 'Exposición de proyectos' },
          anio: { type: 'integer', example: 2024 },
          estado: { type: 'integer', enum: [0, 1, 2], example: 1 },
          fecha_creacion: { type: 'string', format: 'date-time' }
        }
      },

      // ========== VALIDACIÓN ==========
      ValidacionRequest: {
        type: 'object',
        required: ['estado'],
        properties: {
          estado: { 
            type: 'integer', 
            enum: [0, 1, 2], 
            description: '0=Sin Validar, 1=En Proceso, 2=Validado',
            example: 2 
          },
          comentario: { type: 'string', example: 'Aprobado por el comité' }
        }
      },
      LogValidacion: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          tipo: { type: 'string', enum: ['aniversario', 'evento'] },
          registro_id: { type: 'integer' },
          estado_anterior: { type: 'integer' },
          estado_nuevo: { type: 'integer' },
          validado_por: { type: 'integer' },
          comentario: { type: 'string' },
          fecha_validacion: { type: 'string', format: 'date-time' }
        }
      },

      // ========== ESTADÍSTICAS ==========
      Estadisticas: {
        type: 'object',
        properties: {
          totalAniversarios: { type: 'integer', example: 15 },
          totalEventos: { type: 'integer', example: 8 },
          totalImagenes: { type: 'integer', example: 45 },
          totalUsuarios: { type: 'integer', example: 3 },
          porAnio: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                anio: { type: 'integer' },
                cantidad: { type: 'integer' }
              }
            }
          },
          porEstado: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                estado: { type: 'integer' },
                cantidad: { type: 'integer' }
              }
            }
          }
        }
      },

      // ========== RESPUESTAS COMUNES ==========
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Descripción del error' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operación realizada correctamente' }
        }
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          database: { type: 'string', enum: ['connected', 'disconnected'] },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      Unauthorized: {
        description: 'No autorizado - Token inválido o expirado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Token inválido o expirado' }
          }
        }
      },
      Forbidden: {
        description: 'Prohibido - No tiene permisos para esta acción',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'No tiene permisos para realizar esta acción' }
          }
        }
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Recurso no encontrado' }
          }
        }
      },
      BadRequest: {
        description: 'Solicitud inválida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Datos de entrada inválidos' }
          }
        }
      },
      ServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Error interno del servidor' }
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './index.js']
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
