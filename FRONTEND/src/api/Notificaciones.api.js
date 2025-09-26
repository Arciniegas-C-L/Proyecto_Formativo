// src/api/Notificaciones.api.js
import { api } from "./axios";

// 📩 Listar notificaciones
export const listarNotificaciones = (params = {}) =>
  api.get("notificaciones/", { params });

// 📩 Marcar notificación como leída
export const marcarNotificacionLeida = (id) =>
  api.post(`notificaciones/${id}/leer/`);

// 📩 Marcar todas como leídas
export const marcarTodasNotificaciones = () =>
  api.post("notificaciones/marcar_todas/");

// 📩 Eliminar una notificación
export const eliminarNotificacion = (id) =>
  api.delete(`notificaciones/${id}/`);

// 📩 Obtener resumen (conteos de badge campana)
export const resumenNotificaciones = () =>
  api.get("notificaciones/resumen/");
