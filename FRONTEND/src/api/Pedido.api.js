import { api } from "./axios";

/** Lista pedidos del usuario autenticado (tu backend ya filtra por request.user). */
export const listarPedidos = (params = {}) =>
  api.get("pedido/", { params });

/** (Opcional) Detalle de un pedido */
export const getPedido = (id) =>
  api.get(`pedido/${id}/`);
