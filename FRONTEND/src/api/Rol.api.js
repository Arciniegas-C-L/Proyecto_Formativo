
import { api } from './roles';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* ---------------------- ROLES ---------------------- */

// Obtener todos los roles
export const getALLRoles = () => api.get('rol/');

// Crear un nuevo rol
export const createRol = (Rol) => api.post('rol/', Rol);

// Eliminar un rol por ID
export const deleteRol = (id) => api.delete(`rol/${id}/`);

// Actualizar un rol por ID
export const updateRol = (id, Rol) => api.put(`rol/${id}/`, Rol);
