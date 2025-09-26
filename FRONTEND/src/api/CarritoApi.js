// src/api/CarritoApi.js
import { api } from "./axios";
import { publicApi } from "./publicClient";
import { auth } from "../auth/authService";

const hasToken = () => {
  const t = auth.obtenerToken?.();
  return !!(t && String(t).trim() !== "");
};
const getRol = () => auth.obtenerRol?.() || null;
const isPublicRole = () => !hasToken() || ["Invitado", "guest"].includes(getRol());

const clientReadCart  = () => (isPublicRole() ? publicApi : api);
const clientWriteCart = () => (isPublicRole() ? publicApi : api);

const clientProtectedOnly = () => {
  if (!hasToken()) {
    const err = new Error("NO_AUTORIZADO");
    err.status = 401;
    err.detail = "Debe iniciar sesión para realizar esta acción";
    throw err;
  }
  return api;
};

const buildAddBody = (data, opts = {}) => ({
  producto: parseInt(data.producto),
  cantidad: parseInt(data.cantidad),
  ...(data.talla ? { talla: parseInt(data.talla) } : {}),
  ...(opts ? { ...opts } : {}),
});

/* ====== NUEVO: obtener un carrito por id ====== */
export const getCarrito = (id) => clientReadCart().get(`carrito/${id}/`);

/* ====== CAMBIO: si eres anónimo y hay cartId en localStorage, pide detalle ====== */
export const fetchCarritos = () => {
  if (isPublicRole()) {
    const lsId = localStorage.getItem("cartId");
    if (lsId) return publicApi.get(`carrito/${lsId}/`);
  }
  return clientReadCart().get("carrito/");
};

export const createCarrito = (carrito) => clientWriteCart().post("carrito/", carrito);
export const updateCarrito = (id, carrito) => clientWriteCart().put(`carrito/${id}/`, carrito);
export const deleteCarrito = (id) => clientWriteCart().delete(`carrito/${id}/`);

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

export const crearPreferenciaPago = async (id, payload) => {
  const body = typeof payload === "string" ? { email: payload } : { ...payload };
  const res = await clientProtectedOnly().post(`carrito/${id}/crear_preferencia_pago/`, body);
  if (res.status === 403) { const err = new Error("Forbidden"); err.response = res; throw err; }
  return res;
};

// (resto igual)
