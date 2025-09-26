// src/api/Facturas.api.js (tu archivo actual)
import { api } from "./axios";
import { auth } from "../auth/authService";

// --- helpers de rol ---
const ALLOWED = new Set(["admin", "cliente"]);
const canAccessFacturas = () => {
  const token = auth.obtenerToken?.();
  const rol = (auth.obtenerRol?.() || "").toLowerCase();
  return Boolean(token) && ALLOWED.has(rol);
};
const requireAuth = (msg = "Necesitas iniciar sesión para continuar") =>
  Promise.reject(new Error(msg));

// Ya tienes:
export const crearFacturaDesdePago = (body) => {
  if (!canAccessFacturas()) return requireAuth("Necesitas iniciar sesión para crear la factura");
  return api.post("facturas/crear_desde_pago/", body);
};

export const getFactura = (id) => {
  if (!canAccessFacturas()) return requireAuth("Inicia sesión para ver tu factura");
  return api.get(`facturas/${id}/`);
};

export const descargarFacturaPDF = (id) => {
  if (!canAccessFacturas()) return requireAuth("Inicia sesión para descargar la factura");
  return api.get(`facturas/${id}/pdf/`, { responseType: "blob" });
};

// ✅ Nuevo: listar facturas (shape vacío si es invitado)
export const listarFacturas = (params = {}) => {
  if (!canAccessFacturas()) {
    // DRF list shape
    return Promise.resolve({ data: { results: [], count: 0 } });
  }
  return api.get("facturas/", { params });
};

// ✅ Opcional: buscar por número exacto (asumimos protegido)
export const buscarFacturaPorNumero = (numero) => {
  if (!canAccessFacturas()) return requireAuth("Inicia sesión para buscar facturas");
  return api.get(`facturas/por-numero/${encodeURIComponent(numero)}/`);
};

// ✅ Nuevo: descargar comprobante de pago (protegido)
export const descargarComprobantePago = (id) => {
  if (!canAccessFacturas()) return requireAuth("Inicia sesión para descargar el comprobante");
  return api.get(`facturas/${id}/comprobante/pdf/`, { responseType: "blob" });
};
