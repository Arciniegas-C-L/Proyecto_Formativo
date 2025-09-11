// src/api/PedidoProducto.api.js
import { api } from "./axios";

/** Lista todos los items pedido-producto (puedes filtrar con params) */
export const listarPedidoProductos = (params = {}) =>
  api.get("pedidoproductos/", { params });

/** Lista los items de un pedido específico usando query ?pedido=<id> */
export const listarItemsDePedido = (pedidoId, params = {}) =>
  api.get("pedidoproductos/", { params: { pedido: pedidoId, ...params } });

/** Alternativa: usa el endpoint dedicado /por_pedido/?pedido=<id> */
export const listarItemsDePedidoAlt = (pedidoId, params = {}) =>
  api.get("pedidoproductos/por_pedido/", { params: { pedido: pedidoId, ...params } });

/** Detalle de un item pedido-producto */
export const getPedidoProducto = (id) =>
  api.get(`pedidoproductos/${id}/`);

/** (Opcional) crear un item de pedido-producto */
export const crearPedidoProducto = (payload) =>
  api.post("pedidoproductos/", payload);

/** (Opcional) actualizar un item */
export const actualizarPedidoProducto = (id, payload) =>
  api.put(`pedidoproductos/${id}/`, payload);

/** (Opcional) eliminar un item */
export const eliminarPedidoProducto = (id) =>
  api.delete(`pedidoproductos/${id}/`);
