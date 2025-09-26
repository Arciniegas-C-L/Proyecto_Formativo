
// src/api/Proveedores.api.js
import { api } from "./axios";
import { auth } from "../auth/authService";

/* ---------------- Helpers de rol (ajusta los nombres si difieren) ---------------- */
const getRol = () => (auth?.obtenerRol?.() || "").toLowerCase();
const canReadProviders = () =>
  ["admin", "administrador", "empleado", "staff"].includes(getRol());
const canWriteProviders = () =>
  ["admin", "administrador", "staff"].includes(getRol());

/* ---------------------- USUARIOS (protegido) ---------------------- */
// Mantengo tus nombres de funciones
export const getUsuarios = () => api.get("usuario/");                 // <- singular
export const updateUsuario = (id, payload) => api.put(`usuario/${id}/`, payload);

/* ---------------------- PROVEEDORES (protegido) ---------------------- */

// Obtener todos los proveedores (lectura)
export const fetchProveedores = () => {
  if (!canReadProviders()) {
    const err = new Error("No tienes permisos para ver proveedores");
    err.code = "NO_ACCESS";
    throw err;
  }
  return api.get("proveedores/");
};

// Crear un nuevo proveedor (escritura)
export const createProveedor = (Proveedor) => {
  if (!canWriteProviders()) {
    const err = new Error("No tienes permisos para crear proveedores");
    err.code = "NO_WRITE";
    throw err;
  }
  return api.post("proveedores/", Proveedor);
};

// Actualizar un proveedor (escritura)
export const updateProveedor = (id, Proveedor) => {
  if (!canWriteProviders()) {
    const err = new Error("No tienes permisos para actualizar proveedores");
    err.code = "NO_WRITE";
    throw err;
  }
  return api.put(`proveedores/${id}/`, Proveedor);
};

// Eliminar un proveedor (escritura)
export const deleteProveedor = (id) => {
  if (!canWriteProviders()) {
    const err = new Error("No tienes permisos para eliminar proveedores");
    err.code = "NO_WRITE";
    throw err;
  }
  return api.delete(`proveedores/${id}/`);
};

/* ---------------------- USUARIOS (endpoint extra, protegido) ---------------------- */
export const fetchUsuarios = () => api.get("usuario/");               // <- singular
