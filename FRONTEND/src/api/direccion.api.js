// src/api/Direccion.api.js
import { api } from "./axios";                 // cliente protegido (/BACKEND/api/)
import { auth } from "../auth/authService";

// ---- helpers de rol ----
const ALLOWED = new Set(["admin", "cliente"]);
const canUseDirecciones = () => {
  const token = auth.obtenerToken?.();
  const rol = (auth.obtenerRol?.() || "").toLowerCase();
  return Boolean(token) && ALLOWED.has(rol);
};
const requireAuth = (msg = "Inicia sesión para continuar") =>
  Promise.reject(new Error(msg));

// ================= Direcciones (PROTEGIDO) =================

export const getDirecciones = async () => {
  if (!canUseDirecciones()) return []; // lista vacía para invitados
  const res = await api.get("direccion/");
  return res.data;
};

export const createDireccion = async (data) => {
  if (!canUseDirecciones()) return requireAuth("Inicia sesión para crear direcciones");
  const res = await api.post("direccion/", data);
  return res.data;
};

export const updateDireccion = async (id, data) => {
  if (!canUseDirecciones()) return requireAuth("Inicia sesión para actualizar direcciones");
  const res = await api.put(`direccion/${id}/`, data);
  return res.data;
};

export const deleteDireccion = async (id) => {
  if (!canUseDirecciones()) return requireAuth("Inicia sesión para eliminar direcciones");
  const res = await api.delete(`direccion/${id}/`);
  return res.data;
};

export const setPrincipalDireccion = async (id) => {
  if (!canUseDirecciones()) return requireAuth("Inicia sesión para cambiar tu dirección principal");
  const res = await api.patch(`direccion/${id}/`, { principal: true });
  return res.data;
};
