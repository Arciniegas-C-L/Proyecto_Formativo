import axios from "axios";
// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');

// URL base de la API
const API_BASE_URL = "http://127.0.0.1:8000/BACKEND/api";

// Crear instancia de axios con la URL base
const CarritoApi = axios.create({
    baseURL: `${API_BASE_URL}/carrito/`
});

// API para items del carrito
const CarritoItemApi = axios.create({
    baseURL: `${API_BASE_URL}/carrito-item/`
});

// API para estados del carrito
const EstadoCarritoApi = axios.create({
    baseURL: `${API_BASE_URL}/estado-carrito/`
});

// Operaciones básicas del carrito
export const fetchCarritos = () => CarritoApi.get("");
export const createCarrito = (carrito) => CarritoApi.post("", carrito);
export const updateCarrito = (id, carrito) => CarritoApi.put(`${id}/`, carrito);
export const deleteCarrito = (id) => CarritoApi.delete(`${id}/`);

// Operaciones específicas del carrito
export const agregarProducto = (id, data) => {
    // Asegurarnos de que los datos estén en el formato correcto
    const requestData = {
        producto: parseInt(data.producto),
        cantidad: parseInt(data.cantidad)
    };
    return CarritoApi.post(`${id}/agregar_producto/`, requestData);
};
export const actualizarCantidad = (id, itemId, cantidad) => CarritoApi.post(`${id}/actualizar_cantidad/`, {
    item_id: itemId,
    cantidad: parseInt(cantidad)
});
export const eliminarProducto = (id, itemId) => CarritoApi.post(`${id}/eliminar_producto/`, { item_id: itemId });
export const limpiarCarrito = (id) => CarritoApi.post(`${id}/limpiar_carrito/`);
export const finalizarCompra = (id) => CarritoApi.post(`${id}/finalizar_compra/`);

// Operaciones de items del carrito
export const fetchCarritoItems = () => CarritoItemApi.get("");
export const getCarritoItem = (id) => CarritoItemApi.get(`${id}/`);
export const updateCarritoItem = (id, item) => CarritoItemApi.put(`${id}/`, item);
export const deleteCarritoItem = (id) => CarritoItemApi.delete(`${id}/`);

// Operaciones de estados del carrito
export const fetchEstadosCarrito = () => EstadoCarritoApi.get("");
export const getEstadoCarrito = (id) => EstadoCarritoApi.get(`${id}/`);

// Endpoints del carrito
export const CARRITO_ENDPOINTS = {
    BASE: `${API_BASE_URL}/carrito/`,
    ITEMS: `${API_BASE_URL}/carrito-item/`,
    ESTADOS: `${API_BASE_URL}/estado-carrito/`,
    AGREGAR_PRODUCTO: (id) => `${API_BASE_URL}/carrito/${id}/agregar_producto/`,
    ACTUALIZAR_CANTIDAD: (id) => `${API_BASE_URL}/carrito/${id}/actualizar_cantidad/`,
    ELIMINAR_PRODUCTO: (id) => `${API_BASE_URL}/carrito/${id}/eliminar_producto/`,
    LIMPIAR_CARRITO: (id) => `${API_BASE_URL}/carrito/${id}/limpiar_carrito/`,
    FINALIZAR_COMPRA: (id) => `${API_BASE_URL}/carrito/${id}/finalizar_compra/`
};

// Estados posibles del carrito
export const ESTADOS_CARRITO = {
    ACTIVO: 'activo',
    PENDIENTE: 'pendiente',
    PAGADO: 'pagado',
    ENVIADO: 'enviado',
    ENTREGADO: 'entregado',
    CANCELADO: 'cancelado'
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
    CARRITO_NO_ENCONTRADO: 'Carrito no encontrado',
    PRODUCTO_NO_ENCONTRADO: 'Producto no encontrado',
    STOCK_INSUFICIENTE: 'Stock insuficiente',
    CARRITO_VACIO: 'El carrito está vacío',
    ERROR_SERVIDOR: 'Error en el servidor',
    NO_AUTORIZADO: 'No autorizado',
    NO_PERMISOS: 'No tiene permisos para realizar esta acción'
};

// Tipos de acciones del carrito
export const ACCIONES_CARRITO = {
    AGREGAR: 'agregar',
    ACTUALIZAR: 'actualizar',
    ELIMINAR: 'eliminar',
    LIMPIAR: 'limpiar',
    FINALIZAR: 'finalizar'
}; 