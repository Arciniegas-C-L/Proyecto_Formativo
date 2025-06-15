import axios from "axios";

const InventarioApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/inventario/"
});

// Interceptor para actualizar el token si cambia
InventarioApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getAllInventario = async () => {
  try {
    const res = await InventarioApi.get("/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }
};

export const createInventario = async (inventario) => {
  try {
    const res = await InventarioApi.post("/", inventario);
    return res.data;
  } catch (error) {
    console.error("Error al crear inventario:", error);
    throw error;
  }
};

export const updateInventario = async (id, inventario) => {
  try {
    const res = await InventarioApi.put(`/${id}/`, inventario);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    throw error;
  }
};

export const deleteInventario = async (id) => {
  try {
    const res = await InventarioApi.delete(`/${id}/`);
    return res.data;
  } catch (error) {
    console.error("Error al eliminar inventario:", error);
    throw error;
  }
};

// Nuevas funciones para manejar stock mínimo y tallas por subcategoría
export const updateStockMinimoSubcategoria = async (subcategoriaId, stockMinimo) => {
  try {
    const res = await InventarioApi.put(`/subcategoria/${subcategoriaId}/stock-minimo/`, {
      stockMinimo: parseInt(stockMinimo)
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock mínimo:", error);
    throw error;
  }
};

export const getInventarioPorCategoria = async (categoriaId) => {
  try {
    const res = await InventarioApi.get(`por_categoria/?categoria_id=${categoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por categoría:", error);
    throw error;
  }
};

export const getInventarioPorSubcategoria = async (subcategoriaId) => {
  try {
    const res = await InventarioApi.get(`por_subcategoria/?subcategoria_id=${subcategoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por subcategoría:", error);
    throw error;
  }
};

// Nuevas funciones para el manejo de tablas
export const getTablaCategorias = async () => {
  try {
    const res = await InventarioApi.get("tabla_categorias/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de categorías:", error);
    throw error;
  }
};

export const getTablaSubcategorias = async (categoriaId) => {
  try {
    const res = await InventarioApi.get(`tabla_subcategorias/?categoria_id=${categoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de subcategorías:", error);
    throw error;
  }
};

export const getTablaProductos = async (subcategoriaId) => {
  try {
    const res = await InventarioApi.get(`tabla_productos/?subcategoria_id=${subcategoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de productos:", error);
    throw error;
  }
};

export const actualizarStockTallas = async (productoId, tallasData) => {
  try {
    const res = await InventarioApi.post("actualizar_stock_tallas/", {
      producto_id: productoId,
      tallas: tallasData.map(({ talla_id, stock, stock_minimo }) => ({
        talla_id,
        stock: parseInt(stock),
        stock_minimo: parseInt(stock_minimo)
      }))
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock por talla:", error);
    throw error;
  }
};
