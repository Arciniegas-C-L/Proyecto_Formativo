
import { api } from './axios';

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

// Crear un nuevo producto (JSON)
export const createProducto = async (data) => {
  try {
    return await api.post('producto/', data, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(' Backend respondió:', error.response?.data); 
    handleProductoError(error);
    throw error;
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

// Actualizar un producto por ID (JSON)
export const updateProducto = async (id, data) => {
  try {
    return await api.put(`producto/${id}/`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(' Backend al actualizar:', error.response?.data);
    handleProductoError(error);
    throw error;
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
  if (idCategoria === null || idCategoria === undefined || idCategoria === '' || idCategoria === 'null') {
    return { data: [] }; // forma compatible con tu consumo actual
  }
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
