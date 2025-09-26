// src/api/InventarioApi.js
import { api } from "./axios"; // cliente principal hacia /BACKEND/api/

/* ---------------- Usuarios ---------------- */
export const getUsuarios = () =>
  api.get("usuario/"); // <- endpoint singular

export const updateUsuario = (id, payload) =>
  api.put(`usuario/${id}/`, payload);

/* ---------------- CRUD Inventario ---------------- */
export const getAllInventario = async () => {
  try {
    const res = await api.get("inventario/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }
};

export const createInventario = async (inventario) => {
  try {
    const res = await api.post("inventario/", inventario);
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

/* -------- Stock mínimo y filtros -------- */
export const updateStockMinimoSubcategoria = async (subcategoriaId, stockMinimo) => {
  try {
    const res = await api.put(
      `inventario/subcategoria/${subcategoriaId}/stock-minimo/`,
      { stockMinimo: parseInt(stockMinimo, 10) }
    );
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock mínimo:", error);
    throw error;
  }
};

export const getInventarioPorCategoria = async (categoriaId) => {
  try {
    const res = await api.get("inventario/por_categoria/", {
      params: { categoria_id: categoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por categoría:", error);
    throw error;
  }
};

export const getInventarioPorSubcategoria = async (subcategoriaId) => {
  try {
    const res = await api.get("inventario/por_subcategoria/", {
      params: { subcategoria_id: subcategoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por subcategoría:", error);
    throw error;
  }
};

/* ---------------- Tablas asociadas ---------------- */
export const getTablaCategorias = async () => {
  try {
    const res = await api.get("inventario/tabla_categorias/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de categorías:", error);
    throw error;
  }
};

export const getTablaSubcategorias = async (categoriaId) => {
  try {
    const res = await api.get("inventario/tabla_subcategorias/", {
      params: { categoria_id: categoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de subcategorías:", error);
    throw error;
  }
};

export const getTablaProductos = async (subcategoriaId) => {
  try {
    const res = await api.get("inventario/tabla_productos/", {
      params: { subcategoria_id: subcategoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de productos:", error);
    throw error;
  }
};

/* ------------ Actualizar stock por tallas ------------ */
export const actualizarStockTallas = async (productoId, tallasData) => {
  try {
    const res = await api.post("inventario/actualizar_stock_tallas/", {
      producto_id: productoId,
      tallas: (tallasData || []).map(({ talla_id, stock, stock_minimo }) => ({
        talla_id,
        stock: parseInt(stock, 10),
        stock_minimo: parseInt(stock_minimo, 10),
      })),
    });
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock por talla:", error);
    throw error;
  }
};

/* ------------ Sincronizar inventario al cambiar grupo de tallas ------------ */
export const setGrupoTallaSubcategoria = async (subcategoriaId, grupoTallaId) => {
  try {
    const res = await api.post("inventario/set_grupo_talla_subcategoria/", {
      subcategoria_id: subcategoriaId,
      grupo_talla_id: grupoTallaId,
    });
    return res.data;
  } catch (error) {
    console.error("Error al sincronizar inventario tras cambio de grupo:", error);
    throw error;
  }
};

