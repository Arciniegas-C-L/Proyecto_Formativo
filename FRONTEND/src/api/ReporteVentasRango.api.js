// src/api/ReporteVentasRango.api.js
import { api } from "./axios";

/**
 * Genera o regenera un reporte de ventas por rango.
 * @param {{desde:string, hasta:string, solo_aprobados?:boolean}} body
 * @returns {Promise<import('axios').AxiosResponse>}
 * @example
 * await generarReporteVentas({ desde: "2025-09-01", hasta: "2025-09-28", solo_aprobados: true })
 */
export const generarReporteVentas = (body) => {
  return api.post("reportes/ventas/rango/generar/", body);
};

/**
 * Lista reportes (cabeceras/KPIs) con filtros y paginación.
 * @param {{desde?:string, hasta?:string, page?:number, page_size?:number}} [params]
 * @returns {Promise<import('axios').AxiosResponse>}
 * @example
 * await listarReportesVentas({ desde: "2025-09-01", hasta: "2025-09-28", page:1, page_size:20 })
 */
export const listarReportesVentas = (params = {}) => {
  return api.get("reportes/ventas/rango/", { params });
};

/**
 * Obtiene el detalle (KPIs) de un reporte por id.
 * @param {number|string} id
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getReporteVentas = (id) => {
  if (id == null) throw new Error("getReporteVentas: id es requerido");
  return api.get(`reportes/ventas/rango/${id}/`);
};

/**
 * Lista items (detalle por producto) de un reporte.
 * @param {number|string} id
 * @param {{ordering?: "-cantidad"|"cantidad"|"-ingresos"|"ingresos"|"-tickets"|"tickets", page?:number, page_size?:number}} [params]
 * @returns {Promise<import('axios').AxiosResponse>}
 * @example
 * await listarItemsReporteVentas(5, { ordering: "-ingresos", page: 1, page_size: 50 })
 */
export const listarItemsReporteVentas = (id, params = {}) => {
  if (id == null) throw new Error("listarItemsReporteVentas: id es requerido");
  return api.get(`reportes/ventas/rango/${id}/items/`, { params });
};

/**
 * Elimina un reporte por id.
 * @param {number|string} id
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const eliminarReporteVentas = (id) => {
  if (id == null) throw new Error("eliminarReporteVentas: id es requerido");
  return api.delete(`reportes/ventas/rango/${id}/`);
};

/** Ordenamientos permitidos para items */
export const ORDERING = {
  MAS_VENDIDOS: "-cantidad",
  MENOS_VENDIDOS: "cantidad",
  MAYOR_INGRESO: "-ingresos",
  MENOR_INGRESO: "ingresos",
  MAS_TICKETS: "-tickets",
  MENOS_TICKETS: "tickets",
};
