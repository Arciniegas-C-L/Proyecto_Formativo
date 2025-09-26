// src/api/InventarioApi.js
import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient";  // (no se usa aquí, todo inventario es protegido)
import { auth } from "../auth/authService";

/* ---------------- Helper: cliente protegido con chequeo de rol ---------------- */
function getProtectedClient(rolesPermitidos = []) {
  const token = auth.obtenerToken?.();
  const rol   = auth.obtenerRol?.();

  // Siempre usamos el cliente protegido
  const client = api;

  // Si se especifican roles, validamos en front para evitar 404/403 innecesarios
  if (rolesPermitidos.length > 0 && rol && !rolesPermitidos.includes(rol)) {
    const err = new Error("NO_PERMISOS");
    err.status = 403;
    err.detail = "No tiene permisos para realizar esta acción";
    throw err;
  }

  // Si no hay token, el backend devolverá 401 (interceptor ya limpia sesión)
  return client;
}

/* ---------------- Usuarios (protegido) ---------------- */
export const getUsuarios = () =>
  getProtectedClient(["admin", "empleado"]).get("usuario/"); // <- singular

export const updateUsuario = (id, payload) =>
  getProtectedClient(["admin"]).put(`usuario/${id}/`, payload);

/* ---------------- CRUD Inventario (protegido) ---------------- */
// Por defecto: admin/empleado
const INV_ROLES = ["admin", "empleado"];

export const getAllInventario = async () => {
  try {
    const res = await getProtectedClient(INV_ROLES).get("inventario/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }
};

export const createInventario = async (inventario) => {
  try {
    const res = await getProtectedClient(INV_ROLES).post("inventario/", inventario);
    return res.data;
  } catch (error) {
    console.error("Error al crear inventario:", error);
    throw error;
  }
};

export const updateInventario = async (id, inventario) => {
  try {
    const res = await getProtectedClient(INV_ROLES).put(`inventario/${id}/`, inventario);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    throw error;
  }
};

export const deleteInventario = async (id) => {
  try {
    const res = await getProtectedClient(INV_ROLES).delete(`inventario/${id}/`);
    return res.data;
  } catch (error) {
    console.error("Error al eliminar inventario:", error);
    throw error;
  }
};

/* -------- Stock mínimo y filtros (protegido) -------- */
export const updateStockMinimoSubcategoria = async (subcategoriaId, stockMinimo) => {
  try {
    const res = await getProtectedClient(INV_ROLES).put(
      `inventario/subcategoria/${subcategoriaId}/stock-minimo/`,
      { stockMinimo: parseInt(stockMinimo) }
    );
    return res.data;
  } catch (error) {
    console.error("Error al actualizar stock mínimo:", error);
    throw error;
  }
};

export const getInventarioPorCategoria = async (categoriaId) => {
  try {
    const res = await getProtectedClient(INV_ROLES).get("inventario/por_categoria/", {
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
    const res = await getProtectedClient(INV_ROLES).get("inventario/por_subcategoria/", {
      params: { subcategoria_id: subcategoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario por subcategoría:", error);
    throw error;
  }
};

/* ---------------- Tablas asociadas (protegido) ---------------- */
export const getTablaCategorias = async () => {
  try {
    const res = await getProtectedClient(INV_ROLES).get("inventario/tabla_categorias/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de categorías:", error);
    throw error;
  }
};

export const getTablaSubcategorias = async (categoriaId) => {
  try {
    const res = await getProtectedClient(INV_ROLES).get("inventario/tabla_subcategorias/", {
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
    const res = await getProtectedClient(INV_ROLES).get("inventario/tabla_productos/", {
      params: { subcategoria_id: subcategoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener tabla de productos:", error);
    throw error;
  }
};

/* ------------ Actualizar stock por tallas (protegido) ------------ */
export const actualizarStockTallas = async (productoId, tallasData) => {
  try {
    const res = await getProtectedClient(INV_ROLES).post("inventario/actualizar_stock_tallas/", {
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

/* ------------ Sincronizar inventario al cambiar grupo de tallas (protegido) ------------ */
export const setGrupoTallaSubcategoria = async (subcategoriaId, grupoTallaId) => {
  try {
    const res = await getProtectedClient(INV_ROLES).post("inventario/set_grupo_talla_subcategoria/", {
      subcategoria_id: subcategoriaId,
      grupo_talla_id: grupoTallaId,
    });
    return res.data;
  } catch (error) {
    console.error("Error al sincronizar inventario tras cambio de grupo:", error);
    throw error;
  }
};
