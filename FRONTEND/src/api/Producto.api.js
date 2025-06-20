import axios from "axios";

// API para productos
const ProductoApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/producto/",
});

// Interceptor para manejar errores
ProductoApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      switch (error.response.status) {
        case 404:
          throw new Error('El producto no fue encontrado');
        case 500:
          throw new Error('Error interno del servidor. Por favor, intente más tarde');
        default:
          throw new Error(error.response.data?.detail || error.response.data?.message || 'Error al procesar la solicitud');
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Algo sucedió al configurar la solicitud
      throw new Error('Error al procesar la solicitud');
    }
  }
);

export const getProductosPaginados = (page = 1, pageSize = 10) =>
  ProductoApi.get(`/?page=${page}&page_size=${pageSize}`);

export const createProducto = (producto) => ProductoApi.post("/", producto);
export const deleteProducto = async (id) => {
  try {
    const response = await ProductoApi.delete(`${id}/`); // Agregamos el slash al final
    return response;
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    throw error;
  }
};
export const updateProducto = (id, producto) => ProductoApi.put(`${id}/`, producto);

// API para categorías
const CategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/categoria/",
});

export const getCategorias = () => CategoriaApi.get("/");

const SubcategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/subcategoria/",
});

export const getSubcategoriasPorCategoria = (idCategoria) =>
  SubcategoriaApi.get(`?categoria=${idCategoria}`);