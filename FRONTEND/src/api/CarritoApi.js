// src/api/CarritoApi.js
import { api } from "./axios";              // PROTEGIDO (con token) → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO (sin token) → /BACKEND/...
import { auth } from "../auth/authService";

/* ───────────── Helpers de selección ───────────── */
const hasToken = () => {
  const t = auth.obtenerToken?.();
  return !!(t && String(t).trim() !== "");
};
const getRol = () => auth.obtenerRol?.() || null;
const isPublicRole = () => !hasToken() || ["Invitado", "guest"].includes(getRol());

// Lecturas del carrito → público si no hay sesión; protegido si hay token
const clientReadCart = () => (isPublicRole() ? publicApi : api);

// Escrituras del carrito → público si no hay sesión; protegido si hay token
const clientWriteCart = () => (isPublicRole() ? publicApi : api);

// Forzar protegido (requiere token), útil para endpoints que tu backend NO permite anónimo
const clientProtectedOnly = () => {
  if (!hasToken()) {
    const err = new Error("NO_AUTORIZADO");
    err.status = 401;
    err.detail = "Debe iniciar sesión para realizar esta acción";
    throw err;
  }
  return api;
};

const addressToString = (addr = {}) => {
  const { nombre, telefono, departamento, ciudad, linea1, linea2, referencia } = addr || {};
  return [
    nombre ? `Nombre: ${nombre}` : null,
    telefono ? `Tel: ${telefono}` : null,
    (departamento || ciudad)
      ? `Ubicación: ${departamento || ""}${departamento && ciudad ? " - " : ""}${ciudad || ""}`
      : null,
    linea1 ? `Dirección: ${linea1}` : null,
    linea2 ? `Compl.: ${linea2}` : null,
    referencia ? `Ref.: ${referencia}` : null,
  ].filter(Boolean).join(" | ");
};

const buildAddBody = (data, opts = {}) => ({
  producto: parseInt(data.producto),
  cantidad: parseInt(data.cantidad),
  ...(data.talla ? { talla: parseInt(data.talla) } : {}),
  ...(opts ? { ...opts } : {}),
});

/* ───────────── Operaciones básicas (lecturas/escrituras) ───────────── */
export const fetchCarritos = () => clientReadCart().get("carrito/");

export const createCarrito = (carrito) => clientWriteCart().post("carrito/", carrito);
export const updateCarrito = (id, carrito) => clientWriteCart().put(`carrito/${id}/`, carrito);
export const deleteCarrito = (id) => clientWriteCart().delete(`carrito/${id}/`);

/* También dejas disponibles las “anon” por compatibilidad (fuerzan público) */
export const createCarritoAnon = (carrito) => publicApi.post("carrito/", carrito);

/* ───────────── Operaciones específicas del carrito ───────────── */
export const agregarProducto = (id, data, opts = {}) =>
  clientWriteCart().post(`carrito/${id}/agregar_producto/`, buildAddBody(data, opts));

export const actualizarCantidad = (id, itemId, cantidad, opts = {}) =>
  clientWriteCart().post(`carrito/${id}/actualizar_cantidad/`, {
    item_id: itemId,
    cantidad: parseInt(cantidad),
    ...(opts ? { ...opts } : {}),
  });

export const eliminarProducto = (id, itemId, opts = {}) =>
  clientWriteCart().post(`carrito/${id}/eliminar_producto/`, {
    item_id: itemId,
    ...(opts ? { ...opts } : {}),
  });

export const limpiarCarrito = (id, opts = {}) =>
  clientWriteCart().post(`carrito/${id}/limpiar_carrito/`, { ...(opts ? { ...opts } : {}) });

export const finalizarCompra = (id) => clientWriteCart().post(`carrito/${id}/finalizar_compra/`);

/* Versión forzada pública por compatibilidad */
export const agregarProductoAnon = (id, data, opts = {}) =>
  publicApi.post(`carrito/${id}/agregar_producto/`, buildAddBody(data, opts));

/* ───────────── Mercado Pago ─────────────
   Tu backend exige protegido para crear preferencia → token obligatorio */
export const crearPreferenciaPago = async (id, payload) => {
  const body = typeof payload === "string" ? { email: payload } : { ...payload };
  if (body?.address && !body.direccion) body.direccion = addressToString(body.address);

  const res = await clientProtectedOnly().post(`carrito/${id}/crear_preferencia_pago/`, body);
  if (res.status === 403) {
    const err = new Error("Forbidden");
    err.response = res;
    throw err;
  }
  return res;
};

/* ───────────── Items / Estados ─────────────
   CarritoItem: tu permiso custom suele permitir anónimo → dinámico.
   EstadoCarrito: en tu código está protegido (IsAuthenticated) → forzamos token.
*/
export const fetchCarritoItems = () => clientReadCart().get("carrito-item/");
export const getCarritoItem    = (id) => clientReadCart().get(`carrito-item/${id}/`);
export const updateCarritoItem = (id, item) => clientWriteCart().put(`carrito-item/${id}/`, item);
export const deleteCarritoItem = (id) => clientWriteCart().delete(`carrito-item/${id}/`);

export const fetchEstadosCarrito = () => clientProtectedOnly().get("estado-carrito/");
export const getEstadoCarrito    = (id) => clientProtectedOnly().get(`estado-carrito/${id}/`);
export const consultarEstadoCarrito = (params) =>
  clientProtectedOnly().get("estado-carrito/consultar_estado/", { params });

/* ───────────── Constantes (sin cambios) ───────────── */
export const CARRITO_ENDPOINTS = {
  BASE: "carrito/",
  ITEMS: "carrito-item/",
  ESTADOS: "estado-carrito/",
  AGREGAR_PRODUCTO: (id) => `carrito/${id}/agregar_producto/`,
  ACTUALIZAR_CANTIDAD: (id) => `carrito/${id}/actualizar_cantidad/`,
  ELIMINAR_PRODUCTO: (id) => `carrito/${id}/eliminar_producto/`,
  LIMPIAR_CARRITO: (id) => `carrito/${id}/limpiar_carrito/`,
  FINALIZAR_COMPRA: (id) => `carrito/${id}/finalizar_compra/`,
  CREAR_PREFERENCIA_PAGO: (id) => `carrito/${id}/crear_preferencia_pago/`,
  CONSULTAR_ESTADO: () => `estado-carrito/consultar_estado/`,
};

export const ESTADOS_CARRITO = {
  ACTIVO: "activo",
  PENDIENTE: "pendiente",
  PAGADO: "pagado",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
};

export const ERROR_MESSAGES = {
  CARRITO_NO_ENCONTRADO: "Carrito no encontrado",
  PRODUCTO_NO_ENCONTRADO: "Producto no encontrado",
  STOCK_INSUFICIENTE: "Stock insuficiente",
  CARRITO_VACIO: "El carrito está vacío",
  ERROR_SERVIDOR: "Error en el servidor",
  NO_AUTORIZADO: "No autorizado",
  NO_PERMISOS: "No tiene permisos para realizar esta acción",
};

export const ACCIONES_CARRITO = {
  AGREGAR: "agregar",
  ACTUALIZAR: "actualizar",
  ELIMINAR: "eliminar",
  LIMPIAR: "limpiar",
  FINALIZAR: "finalizar",
  CREAR_PREFERENCIA: "crear_preferencia",
  CONSULTAR_ESTADO: "consultar_estado",
};

/* Extra (corrijo plural según tu router DRF: /usuario/) */
export const getUsuarios = () => clientProtectedOnly().get("usuario/");
