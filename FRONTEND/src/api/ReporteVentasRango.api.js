// src/api/ReporteVentasRango.api.js
import { api } from "./axios";
import { auth } from "../auth/authService";

/* ───────────── Helpers de rol ───────────── */
const getRol = () => (auth.obtenerRol?.() || "").toLowerCase();
const isAdmin = () => ["admin", "administrador"].includes(getRol());
// Lectura permitida a más roles si los usas (ajústalo a tus nombres)
const canReadReports = () =>
  isAdmin() || ["empleado", "staff", "analista", "manager", "gerente"].includes(getRol());

/**
 * Generar (o regenerar) un reporte por rango. (SOLO ADMIN)
 * Body: { desde: "YYYY-MM-DD", hasta: "YYYY-MM-DD", solo_aprobados?: true }
 */
export const generarReporteVentas = (body) => {
  if (!isAdmin()) {
    const err = new Error("No tienes permisos para generar reportes");
    err.code = "NO_ADMIN";
    throw err;
  }
  return api.post("reportes/ventas/rango/generar/", body);
};

/**
 * Listar reportes generados (cabeceras/KPIs). (LECTURA)
 * Params: { desde?, hasta?, page?, page_size? }
 */
export const listarReportesVentas = (params = {}) => {
  if (!canReadReports()) {
    const err = new Error("No tienes permisos para ver reportes");
    err.code = "NO_ACCESS";
    throw err;
  }
  return api.get("reportes/ventas/rango/", { params });
};

/**
 * Obtener detalle (KPIs) de un reporte por su id. (LECTURA)
 */
export const getReporteVentas = (id) => {
  if (!canReadReports()) {
    const err = new Error("No tienes permisos para ver reportes");
    err.code = "NO_ACCESS";
    throw err;
  }
  return api.get(`reportes/ventas/rango/${id}/`);
};

/**
 * Listar items (detalle por producto) de un reporte. (LECTURA)
 * Params: { ordering?, page?, page_size? }
 */
export const listarItemsReporteVentas = (id, params = {}) => {
  if (!canReadReports()) {
    const err = new Error("No tienes permisos para ver reportes");
    err.code = "NO_ACCESS";
    throw err;
  }
  return api.get(`reportes/ventas/rango/${id}/items/`, { params });
};

/* ───────────── Helpers opcionales para ordering ───────────── */
export const ORDERING = {
  MAS_VENDIDOS: "-cantidad",
  MENOS_VENDIDOS: "cantidad",
  MAYOR_INGRESO: "-ingresos",
  MENOR_INGRESO: "ingresos",
  MAS_TICKETS: "-tickets",
  MENOS_TICKETS: "tickets",
};

/**
 * Eliminar un reporte por id. (SOLO ADMIN)
 */
export const eliminarReporteVentas = (id) => {
  if (!isAdmin()) {
    const err = new Error("No tienes permisos para eliminar reportes");
    err.code = "NO_ADMIN";
    throw err;
  }
  return api.delete(`reportes/ventas/rango/${id}/`);
};
