import { api } from "./axios";

// Ya tienes:
export const crearFacturaDesdePago = (body) =>
  api.post("facturas/crear_desde_pago/", body);

export const getFactura = (id) => api.get(`facturas/${id}/`);

export const descargarFacturaPDF = (id) =>
  api.get(`facturas/${id}/pdf/`, { responseType: "blob" });

// ✅ Nuevo: listar facturas (admite filtros/paginación estilo DRF)
export const listarFacturas = (params = {}) =>
  api.get("facturas/", { params });

// ✅ Opcional: buscar por número exacto (si tu backend expone este endpoint)
export const buscarFacturaPorNumero = (numero) =>
  api.get(`facturas/por-numero/${encodeURIComponent(numero)}/`);


