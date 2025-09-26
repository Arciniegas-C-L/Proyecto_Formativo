// src/api/Pedido.api.js
import { api } from "./axios";
import { auth } from "../auth/authService";

/* Helpers de rol/sesión */
const getRol = () => (auth?.obtenerRol?.() || "").toLowerCase();
const hasToken = () => Boolean(auth?.obtenerToken?.());
const isGuest = () => {
  const r = getRol();
  return !hasToken() || r === "guest" || r === "invitado";
};

// Pedidos: SOLO protegido (no existe endpoint público)
const assertCanAccessOrders = () => {
  if (isGuest()) {
    const err = new Error("Debes iniciar sesión para ver pedidos");
    err.code = "NO_AUTH";
    throw err;
  }
  // Roles permitidos (ajusta la lista si quieres restringir más)
  const r = getRol();
  const allowed = ["admin", "administrador", "cliente", "empleado", "staff"];
  if (!allowed.includes(r)) {
    const err = new Error(`Tu rol "${r || "desconocido"}" no puede acceder a pedidos`);
    err.code = "NO_ACCESS";
    throw err;
  }
};

/** Lista pedidos del usuario autenticado (el backend ya filtra por request.user). */
export const listarPedidos = (params = {}) => {
  assertCanAccessOrders();
  return api.get("pedido/", { params });
};

/** Detalle de un pedido por ID (backend valida pertenencia o permisos). */
export const getPedido = (id) => {
  assertCanAccessOrders();
  return api.get(`pedido/${id}/`);
};
