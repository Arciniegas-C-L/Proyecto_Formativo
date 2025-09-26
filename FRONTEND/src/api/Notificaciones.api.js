// src/api/Notificaciones.api.js
import { api } from "./axios";
import { auth } from "../auth/authService";

const BASE = "notificaciones/";

const isGuest = () => {
  const rol = (auth.obtenerRol?.() || "").toLowerCase();
  const token = auth.obtenerToken?.();
  return !token || rol === "invitado";
};

// 📩 Listar notificaciones (protegido; invitados -> vacío)
export const listarNotificaciones = (params = {}) => {
  if (isGuest()) {
    // si usas paginación DRF, respeta el shape
    return Promise.resolve({ data: { results: [], count: 0 } });
  }
  return api.get(BASE, { params });
};

// 📩 Marcar notificación como leída
export const marcarNotificacionLeida = (id) => {
  if (isGuest()) return Promise.resolve({ data: { ok: true } });
  return api.post(`${BASE}${id}/leer/`);
};

// 📩 Marcar todas como leídas
export const marcarTodasNotificaciones = () => {
  if (isGuest()) return Promise.resolve({ data: { ok: true } });
  return api.post(`${BASE}marcar_todas/`);
};

// 📩 Eliminar una notificación
export const eliminarNotificacion = (id) => {
  if (isGuest()) return Promise.resolve({ data: { ok: true } });
  return api.delete(`${BASE}${id}/`);
};

// 📩 Resumen (badge)
export const resumenNotificaciones = () => {
  if (isGuest()) return Promise.resolve({ data: { total: 0, no_leidas: 0 } });
  return api.get(`${BASE}resumen/`);
};
