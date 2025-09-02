
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

// Crear un nuevo producto
export const createProducto = async (formData) => {
  try {
    return await api.post('producto/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
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

// Actualizar un producto por ID
export const updateProducto = async (id, producto) => {
  try {
    let formData;

    // Si ya viene como FormData
    if (producto instanceof FormData) {
      formData = producto;
    } else {
      formData = new FormData();
      for (const key in producto) {
        if (producto[key] !== undefined && producto[key] !== null) {
          formData.append(key, producto[key]);
        }
      }
    }

    return await api.put(`producto/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
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
