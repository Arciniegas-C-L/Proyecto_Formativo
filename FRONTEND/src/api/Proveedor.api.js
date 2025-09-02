
import { api } from './axios';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* ---------------------- PROVEEDORES ---------------------- */

// Obtener todos los proveedores
export const fetchProveedores = () => api.get('proveedores/');

// Crear un nuevo proveedor
export const createProveedor = (Proveedor) => api.post('proveedores/', Proveedor);

// Actualizar un proveedor existente
export const updateProveedor = (id, Proveedor) => api.put(`proveedores/${id}/`, Proveedor);

// Eliminar un proveedor por su ID
export const deleteProveedor = (id) => api.delete(`proveedores/${id}/`);

/* ---------------------- USUARIOS ---------------------- */

// Obtener todos los usuarios (desde otro endpoint)
export const fetchUsuarios = () => api.get('usuario/');
