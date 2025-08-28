
import { api } from './roles';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* ---------------- FUNCIONES CRUD PARA INVENTARIO ---------------- */

export const getAllInventario = async () => {
  try {
    const res = await api.get('inventario/');
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }
};

export const createInventario = async (inventario) => {
  try {
    const res = await api.post('inventario/', inventario);
    return res.data;
  } catch (error) {
    console.error("Error al crear inventario:", error);
    throw error;
  }
};

export const updateInventario = async (id, inventario) => {
  try {
    const res = await api.put(`inventario/${id}/`, inventario);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    throw error;
  }
};

export const deleteInventario = async (id) => {
  try {
    const res = await api.delete(`inventario/${id}/`);
    return res.data;
  } catch (error) {
    console.error("Error al eliminar inventario:", error);
    throw error;
  }
};

/* -------- FUNCIONES ESPECÍFICAS PARA STOCK MÍNIMO Y FILTROS -------- */

export const updateStockMinimoSubcategoria = async (subcategoriaId, stockMinimo) => {
  try {
    const res = await api.put(`inventario/subcategoria/${subcategoriaId}/stock-minimo/`, {
      stockMinimo: parseInt(stockMinimo),
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock mínimo:", error);
    throw error;
  }
};

export const getInventarioPorCategoria = async (categoriaId) => {
  try {
    const res = await api.get(`inventario/por_categoria/?categoria_id=${categoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por categoría:", error);
    throw error;
  }
};

export const getInventarioPorSubcategoria = async (subcategoriaId) => {
  try {
    const res = await api.get(`inventario/por_subcategoria/?subcategoria_id=${subcategoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por subcategoría:", error);
    throw error;
  }
};

/* ---------------- FUNCIONES PARA TABLAS ASOCIADAS ---------------- */

export const getTablaCategorias = async () => {
  try {
    const res = await api.get('inventario/tabla_categorias/');
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de categorías:", error);
    throw error;
  }
};

export const getTablaSubcategorias = async (categoriaId) => {
  try {
    const res = await api.get(`inventario/tabla_subcategorias/?categoria_id=${categoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de subcategorías:", error);
    throw error;
  }
};

export const getTablaProductos = async (subcategoriaId) => {
  try {
    const res = await api.get(`inventario/tabla_productos/?subcategoria_id=${subcategoriaId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de productos:", error);
    throw error;
  }
};

/* ------------ FUNCIONES PARA ACTUALIZAR STOCK POR TALLAS ------------ */

export const actualizarStockTallas = async (productoId, tallasData) => {
  try {
    const res = await api.post('inventario/actualizar_stock_tallas/', {
      producto_id: productoId,
      tallas: tallasData.map(({ talla_id, stock, stock_minimo }) => ({
        talla_id,
        stock: parseInt(stock),
        stock_minimo: parseInt(stock_minimo),
      })),
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock por talla:", error);
    throw error;
  }
};
