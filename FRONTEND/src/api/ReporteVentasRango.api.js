// src/api/ReporteVentasRango.api.js
import { api } from "./axios";

/**
 * Generar (o regenerar) un reporte por rango.
 * Body:
 *  { desde: "YYYY-MM-DD", hasta: "YYYY-MM-DD", solo_aprobados?: true }
 */
export const generarReporteVentas = (body) =>
  api.post("reportes/ventas/rango/generar/", body);

/**
 * Listar reportes generados (cabeceras/KPIs).
 * Params opcionales: { desde?: "YYYY-MM-DD", hasta?: "YYYY-MM-DD", page?, page_size? }
 */
export const listarReportesVentas = (params = {}) =>
  api.get("reportes/ventas/rango/", { params });

/**
 * Obtener detalle (KPIs) de un reporte por su id.
 */
export const getReporteVentas = (id) =>
  api.get(`reportes/ventas/rango/${id}/`);

/**
 * Listar items (detalle por producto) de un reporte.
 * Params opcionales: { ordering?: "-cantidad" | "cantidad" | "-ingresos" | "ingresos" | "-tickets" | "tickets", page?, page_size? }
 */
export const listarItemsReporteVentas = (id, params = {}) =>
  api.get(`reportes/ventas/rango/${id}/items/`, { params });

/* ─────────────────────────────────────────────────────────────
   Helpers opcionales (por si quieres usarlos en el frontend)
   ──────────────────────────────────────────────────────────── */
export const ORDERING = {
  MAS_VENDIDOS: "-cantidad",
  MENOS_VENDIDOS: "cantidad",
  MAYOR_INGRESO: "-ingresos",
  MENOR_INGRESO: "ingresos",
  MAS_TICKETS: "-tickets",
  MENOS_TICKETS: "tickets",
};

export const eliminarReporteVentas = (id) =>
  api.delete(`reportes/ventas/rango/${id}/`);