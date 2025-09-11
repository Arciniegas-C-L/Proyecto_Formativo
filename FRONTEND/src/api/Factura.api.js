// src/api/Factura.api.js
import { api } from "./axios";

/** Crear (o devolver si ya existe) la factura verificando el pago en MP.
 * body: { payment_id?, external_reference?, carrito_id? }
 */
export const crearFacturaDesdePago = (body) =>
  api.post("factura/crear_desde_pago/", body);

export const getFactura = (id) => api.get(`factura/${id}/`);
export const listarFacturas = (params = {}) => api.get("factura/", { params });

export const descargarFacturaPDF = (id) =>
  api.get(`factura/${id}/pdf/`, { responseType: "blob" });
