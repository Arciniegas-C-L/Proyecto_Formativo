// src/api/AlertasActivas.api.js
import { api } from "./axios";

// 🚨 Listar alertas activas (stock bajo o agotado)
export const listarAlertasActivas = (params = {}) =>
  api.get("notificaciones/activas/", { params });

// 🚨 Obtener detalle de una alerta activa específica
export const getAlertaActiva = (id) =>
  api.get(`notificaciones/activas/${id}/`);
