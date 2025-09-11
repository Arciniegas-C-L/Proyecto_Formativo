// src/api/Factura.api.js
import { api } from "./axios";

/** Crear (o devolver si ya existe) la factura verificando el pago en MP.
 * body: { payment_id?, external_reference?, carrito_id? }
 */
export const crearFacturaDesdePago = (body) =>
  api.post("facturas/crear_desde_pago/", body);

export const getFactura = (id) => api.get(`facturas/${id}/`);
export const listarFacturas = (params = {}) => api.get("facturas/", { params });

export const descargarFacturaPDF = (id) =>
  api.get(`facturas/${id}/pdf/`, { responseType: "blob" });
