// src/api/Talla.api.js
import { api } from './roles';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* =================== FUNCIONES PARA LA API DE TALLA =================== */

// Obtener todas las tallas
export const getAllTallas = () => api.get('talla/');

// Obtener una talla específica por su ID
export const getTallaById = (id) => api.get(`talla/${id}/`);

// Crear una nueva talla
export const createTalla = (data) => api.post('talla/', data);

// Actualizar una talla existente por su ID
export const updateTalla = (id, data) => api.put(`talla/${id}/`, data);

// Eliminar una talla por su ID
export const deleteTalla = (id) => api.delete(`talla/${id}/`);

// Cambiar el estado (activo/inactivo) de una talla
export const cambiarEstadoTalla = (id, estado) =>
  api.patch(`talla/${id}/cambiar_estado/`, { estado });

// Obtener todas las tallas que pertenecen a un grupo específico
export const getTallasByGrupo = (grupoId) => api.get(`talla/?grupo=${grupoId}`);

// Obtener solo las tallas que están activas
export const getTallasActivas = () => api.get('talla/?estado=true');
