// Importamos la librería Axios para hacer peticiones HTTP
import axios from "axios";

// Creamos una instancia personalizada de Axios para el módulo de Inventario
const InventarioApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/inventario/" // URL base de la API de inventario
});

// Interceptor para agregar el token JWT automáticamente a cada solicitud
InventarioApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Obtenemos el token del localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Agregamos el token al header Authorization
    }
    return config; // Devolvemos la configuración modificada
  },
  (error) => {
    return Promise.reject(error); // En caso de error, rechazamos la promesa
  }
);

/* ---------------- FUNCIONES CRUD PARA INVENTARIO ---------------- */

// Obtener todos los elementos del inventario
export const getAllInventario = async () => {
  try {
    const res = await InventarioApi.get("/");
    return res.data; // Devolvemos los datos del inventario
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }
};

// Crear un nuevo registro de inventario
export const createInventario = async (inventario) => {
  try {
    const res = await InventarioApi.post("/", inventario);
    return res.data; // Devolvemos el inventario creado
  } catch (error) {
    console.error("Error al crear inventario:", error);
    throw error;
  }
};

// Actualizar un inventario existente por su ID
export const updateInventario = async (id, inventario) => {
  try {
    const res = await InventarioApi.put(`/${id}/`, inventario);
    return res.data; // Devolvemos el inventario actualizado
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    throw error;
  }
};

// Eliminar un inventario por su ID
export const deleteInventario = async (id) => {
  try {
    const res = await InventarioApi.delete(`/${id}/`);
    return res.data; // Retornamos la respuesta del backend
  } catch (error) {
    console.error("Error al eliminar inventario:", error);
    throw error;
  }
};

/* -------- FUNCIONES ESPECÍFICAS PARA STOCK MÍNIMO Y FILTROS -------- */

// Actualizar el stock mínimo de una subcategoría específica
export const updateStockMinimoSubcategoria = async (subcategoriaId, stockMinimo) => {
  try {
    const res = await InventarioApi.put(`/subcategoria/${subcategoriaId}/stock-minimo/`, {
      stockMinimo: parseInt(stockMinimo) // Aseguramos que sea número entero
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock mínimo:", error);
    throw error;
  }
};

// Obtener inventario filtrado por ID de categoría
export const getInventarioPorCategoria = async (categoriaId) => {
  try {
    const res = await InventarioApi.get(`por_categoria/?categoria_id=${categoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por categoría:", error);
    throw error;
  }
};

// Obtener inventario filtrado por ID de subcategoría
export const getInventarioPorSubcategoria = async (subcategoriaId) => {
  try {
    const res = await InventarioApi.get(`por_subcategoria/?subcategoria_id=${subcategoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por subcategoría:", error);
    throw error;
  }
};

/* ---------------- FUNCIONES PARA TABLAS ASOCIADAS ---------------- */

// Obtener tabla de categorías (usualmente para listarlas o poblar select)
export const getTablaCategorias = async () => {
  try {
    const res = await InventarioApi.get("tabla_categorias/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de categorías:", error);
    throw error;
  }
};

// Obtener tabla de subcategorías filtrada por ID de categoría
export const getTablaSubcategorias = async (categoriaId) => {
  try {
    const res = await InventarioApi.get(`tabla_subcategorias/?categoria_id=${categoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de subcategorías:", error);
    throw error;
  }
};

// Obtener tabla de productos filtrada por ID de subcategoría
export const getTablaProductos = async (subcategoriaId) => {
  try {
    const res = await InventarioApi.get(`tabla_productos/?subcategoria_id=${subcategoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de productos:", error);
    throw error;
  }
};

/* ------------ FUNCIONES PARA ACTUALIZAR STOCK POR TALLAS ------------ */

// Actualizar el stock y stock mínimo para cada talla de un producto
export const actualizarStockTallas = async (productoId, tallasData) => {
  try {
    const res = await InventarioApi.post("actualizar_stock_tallas/", {
      producto_id: productoId,
      tallas: tallasData.map(({ talla_id, stock, stock_minimo }) => ({
        talla_id,
        stock: parseInt(stock),             // Convertimos a entero
        stock_minimo: parseInt(stock_minimo) // Convertimos a entero
      }))
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock por talla:", error);
    throw error;
  }
};
