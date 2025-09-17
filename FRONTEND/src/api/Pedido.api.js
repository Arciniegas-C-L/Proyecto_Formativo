import { api } from "./axios";

/** Lista pedidos del usuario autenticado (el backend ya filtra por request.user). */
export const listarPedidos = (params = {}) =>
  api.get("pedido/", { params });

/** Detalle de un pedido por ID */
export const getPedido = (id) =>
  api.get(`pedido/${id}/`);
