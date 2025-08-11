// Importamos Axios, la librería usada para hacer peticiones HTTP
import axios from "axios";

/* ----------------------------- API PARA PRODUCTOS ----------------------------- */

// Creamos una instancia de Axios para la API de productos
const ProductoApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/producto/", // Ruta base para los endpoints de productos
});

// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);


// Interceptor de respuestas para capturar errores centralizadamente
ProductoApi.interceptors.response.use(
  response => response, // Si la respuesta es exitosa (2xx), se retorna tal cual
  error => {
    if (error.response) {
      // Si la respuesta del servidor tiene un código de error (como 404 o 500)
      switch (error.response.status) {
        case 404:
          throw new Error('El producto no fue encontrado');
        case 500:
          throw new Error('Error interno del servidor. Por favor, intente más tarde');
        default:
          // Captura el mensaje de error del backend si está disponible
          throw new Error(error.response.data?.detail || error.response.data?.message || 'Error al procesar la solicitud');
      }
    } else if (error.request) {
      // Si se hizo la solicitud pero no hubo respuesta del servidor
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Si ocurrió un error durante la configuración de la solicitud
      throw new Error('Error al procesar la solicitud');
    }
  }
);

// Obtener todos los productos
export const getALLProductos = () => ProductoApi.get("/");

// Crear un nuevo producto
export const createProducto = (producto) => ProductoApi.post("/", producto);

// Eliminar un producto por ID
export const deleteProducto = async (id) => {
  try {
    const response = await ProductoApi.delete(`${id}/`); // Importante: incluir `/` al final del endpoint
    return response;
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    throw error;
  }
};

// Actualizar un producto por ID
export const updateProducto = (id, producto) => ProductoApi.put(`${id}/`, producto);

/* ----------------------------- API PARA CATEGORÍAS ----------------------------- */

// Creamos una instancia para la API de categorías
const CategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/categoria/", // Ruta base de categorías
});

// Obtener todas las categorías
export const getCategorias = () => CategoriaApi.get("/");

/* ----------------------------- API PARA SUBCATEGORÍAS ----------------------------- */

// Instancia de Axios para subcategorías
const SubcategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/subcategoria/", // Ruta base de subcategorías
});

// Obtener las subcategorías filtradas por ID de categoría
export const getSubcategoriasPorCategoria = (idCategoria) =>
  SubcategoriaApi.get(`?categoria=${idCategoria}`);
