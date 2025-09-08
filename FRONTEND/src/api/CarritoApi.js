// src/api/Carrito.api.js
import { api } from './axios';

// Operaciones básicas del carrito
export const fetchCarritos = () => api.get('carrito/');
export const createCarrito = (carrito) => api.post('carrito/', carrito);
export const updateCarrito = (id, carrito) => api.put(`carrito/${id}/`, carrito);
export const deleteCarrito = (id) => api.delete(`carrito/${id}/`);

// Operaciones específicas del carrito
export const agregarProducto = (id, data) => {
  const requestData = {
    producto: parseInt(data.producto),
    cantidad: parseInt(data.cantidad),
    talla: data.talla ? parseInt(data.talla) : undefined,
  };
  return api.post(`carrito/${id}/agregar_producto/`, requestData);
};

export const actualizarCantidad = (id, itemId, cantidad) =>
  api.post(`carrito/${id}/actualizar_cantidad/`, {
    item_id: itemId,
    cantidad: parseInt(cantidad),
  });

export const eliminarProducto = (id, itemId) =>
  api.post(`carrito/${id}/eliminar_producto/`, { item_id: itemId });

export const limpiarCarrito = (id) => api.post(`carrito/${id}/limpiar_carrito/`);
export const finalizarCompra = (id) => api.post(`carrito/${id}/finalizar_compra/`);

// 🔥 Nuevo: crear preferencia de pago (Mercado Pago)
export const crearPreferenciaPago = (id, email) =>
  api.post(`carrito/${id}/crear_preferencia_pago/`, { email });

// Operaciones de items del carrito
export const fetchCarritoItems = () => api.get('carrito-item/');
export const getCarritoItem = (id) => api.get(`carrito-item/${id}/`);
export const updateCarritoItem = (id, item) => api.put(`carrito-item/${id}/`, item);
export const deleteCarritoItem = (id) => api.delete(`carrito-item/${id}/`);

// Operaciones de estados del carrito
export const fetchEstadosCarrito = () => api.get('estado-carrito/');
export const getEstadoCarrito = (id) => api.get(`estado-carrito/${id}/`);

// 🔥 Nuevo: consultar estado de un carrito por external_reference o payment_id
export const consultarEstadoCarrito = (params) =>
  api.get('estado-carrito/consultar_estado/', { params });

// Endpoints del carrito
export const CARRITO_ENDPOINTS = {
  BASE: 'carrito/',
  ITEMS: 'carrito-item/',
  ESTADOS: 'estado-carrito/',
  AGREGAR_PRODUCTO: (id) => `carrito/${id}/agregar_producto/`,
  ACTUALIZAR_CANTIDAD: (id) => `carrito/${id}/actualizar_cantidad/`,
  ELIMINAR_PRODUCTO: (id) => `carrito/${id}/eliminar_producto/`,
  LIMPIAR_CARRITO: (id) => `carrito/${id}/limpiar_carrito/`,
  FINALIZAR_COMPRA: (id) => `carrito/${id}/finalizar_compra/`,
  CREAR_PREFERENCIA_PAGO: (id) => `carrito/${id}/crear_preferencia_pago/`, // 🔥
  CONSULTAR_ESTADO: () => `estado-carrito/consultar_estado/`, // 🔥
};

// Estados posibles del carrito
export const ESTADOS_CARRITO = {
  ACTIVO: 'activo',
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado',
  ENVIADO: 'enviado',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  CARRITO_NO_ENCONTRADO: 'Carrito no encontrado',
  PRODUCTO_NO_ENCONTRADO: 'Producto no encontrado',
  STOCK_INSUFICIENTE: 'Stock insuficiente',
  CARRITO_VACIO: 'El carrito está vacío',
  ERROR_SERVIDOR: 'Error en el servidor',
  NO_AUTORIZADO: 'No autorizado',
  NO_PERMISOS: 'No tiene permisos para realizar esta acción',
};

// Tipos de acciones del carrito
export const ACCIONES_CARRITO = {
  AGREGAR: 'agregar',
  ACTUALIZAR: 'actualizar',
  ELIMINAR: 'eliminar',
  LIMPIAR: 'limpiar',
  FINALIZAR: 'finalizar',
  CREAR_PREFERENCIA: 'crear_preferencia', // 🔥
  CONSULTAR_ESTADO: 'consultar_estado',   // 🔥
};

// Extra: usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
