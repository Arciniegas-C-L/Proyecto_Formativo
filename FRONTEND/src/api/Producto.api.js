// src/api/Producto.api.js
import { api } from './roles';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* ----------------------------- PRODUCTOS ----------------------------- */

// Obtener todos los productos
export const getALLProductos = async () => {
  try {
    const response = await api.get('producto/');
    return response;
  } catch (error) {
    handleProductoError(error);
  }
};

// Crear un nuevo producto
export const createProducto = async (producto) => {
  try {
    return await api.post('producto/', producto);
  } catch (error) {
    handleProductoError(error);
  }
};

// Eliminar un producto por ID
export const deleteProducto = async (id) => {
  try {
    return await api.delete(`producto/${id}/`);
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    handleProductoError(error);
  }
};

// Actualizar un producto por ID
export const updateProducto = async (id, producto) => {
  try {
    return await api.put(`producto/${id}/`, producto);
  } catch (error) {
    handleProductoError(error);
  }
};

/* ----------------------------- CATEGORÍAS ----------------------------- */

// Obtener todas las categorías
export const getCategorias = async () => {
  try {
    return await api.get('categoria/');
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

/* ----------------------------- SUBCATEGORÍAS ----------------------------- */

// Obtener las subcategorías filtradas por ID de categoría
export const getSubcategoriasPorCategoria = async (idCategoria) => {
  try {
    return await api.get(`subcategoria/?categoria=${idCategoria}`);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    throw error;
  }
};

/* ----------------------------- MANEJO DE ERRORES ----------------------------- */

function handleProductoError(error) {
  if (error.response) {
    switch (error.response.status) {
      case 404:
        throw new Error('El producto no fue encontrado');
      case 500:
        throw new Error('Error interno del servidor. Por favor, intente más tarde');
      default:
        throw new Error(
          error.response.data?.detail ||
          error.response.data?.message ||
          'Error al procesar la solicitud'
        );
    }
  } else if (error.request) {
    throw new Error('No se pudo conectar con el servidor');
  } else {
    throw new Error('Error al procesar la solicitud');
  }
}
