// src/api/Rol.api.js (o el nombre que ya usas)
import { api } from './axios';
import { auth } from '../auth/authService';

// ───────────────── Usuarios (ajuste de ruta a singular) ─────────────────
export const getUsuarios = () => api.get('usuario/');
export const updateUsuario = (id, payload) => api.put(`usuario/${id}/`, payload);

// ───────────────── Helpers de rol (no cambiamos nombres de funciones) ─────────────────
const isAdmin = () => {
  const r = auth.obtenerRol?.();
  if (!r) return false;
  const v = String(r).toLowerCase();
  return v === 'admin' || v === 'administrador';
};

const assertAdmin = () => {
  if (!isAdmin()) {
    const err = new Error('No tienes permisos para gestionar roles');
    err.code = 'NO_ADMIN';
    throw err;
  }
};

/* ---------------------- ROLES (todo PROTEGIDO) ---------------------- */

// Obtener todos los roles (dejamos que el backend decida si el rol actual puede verlos)
export const getALLRoles = () => api.get('rol/');

// Crear un nuevo rol (solo admin)
export const createRol = (Rol) => {
  assertAdmin();
  return api.post('rol/', Rol);
};

// Eliminar un rol por ID (solo admin)
export const deleteRol = (id) => {
  assertAdmin();
  return api.delete(`rol/${id}/`);
};

// Actualizar un rol por ID (solo admin)
export const updateRol = (id, Rol) => {
  assertAdmin();
  return api.put(`rol/${id}/`, Rol);
};
