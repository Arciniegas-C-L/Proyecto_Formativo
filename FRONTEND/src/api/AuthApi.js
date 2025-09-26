// src/api/InventarioApi.js
import { api } from "./axios";              // cliente principal hacia /BACKEND/api/
import { publicApi } from "./publicClient"; // cliente público (sin auth)
import { auth } from "../auth/authService";

/* ---------------- Usuarios (sin protección) ---------------- */
export const getUsuarios = () => api.get("usuario/"); // <- endpoint singular

export const updateUsuario = (id, payload) =>
  api.put(`usuario/${id}/`, payload);

/* ---------------- CRUD Inventario (sin protección) ---------------- */
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

/* -------- Stock mínimo y filtros (sin protección) -------- */
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

/* ---------------- Tablas asociadas (sin protección) ---------------- */
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

/* ------------ Actualizar stock por tallas (sin protección) ------------ */
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

/* ------------ Sincronizar inventario al cambiar grupo de tallas (sin protección) ------------ */
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

/* ---------------- Selector de cliente (para admin usa token, para cliente lectura pública) ---------------- */
/**
 * Devuelve el cliente correcto:
 *  - Si no hay token → público
 *  - Si hay token → protegido
 *  - Si pasas { force: "public" | "protected" } fuerza ese cliente
 */
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  const logged = !!(token && token.trim() !== "");
  if (options.force === "public") return publicApi;
  if (options.force === "protected") return api;
  return logged ? api : publicApi;
}

/* ---------------- Endpoints mixtos (auto: público o protegido) ---------------- */
// Obtener todos los grupos de talla → público si no logueado, protegido si admin logueado
export const getAllGruposTalla = async () => {
  try {
    const client = getClient(); // auto
    const response = await client.get("grupo-talla/");
    const gruposTalla = (response.data || []).map((grupo) => ({
      ...grupo,
      Tallas: grupo.tallas || [],
    }));
    return gruposTalla; // devolvemos solo data normalizada
  } catch (error) {
    console.error("Error al obtener grupos de talla:", error);
    throw error;
  }
};

/* ---------------- Helpers de autenticación (público/protegido) ---------------- */
/** Login → siempre público */
export async function login(email, password) {
  try {
    const client = getClient({ force: "public" });
    const response = await client.post("usuario/login/", {
      correo: email,
      password,
    });
    const data = response.data;

    auth.guardarSesion({
      access: data?.token?.access,
      refresh: data?.token?.refresh,
      usuario: data?.usuario,
      rol: data?.rol || data?.usuario?.rol,
    });

    return data;
  } catch (error) {
    console.error("Login error:", error?.response?.status, error?.response?.data);
    throw error?.response?.data || { error: "Error inesperado al iniciar sesión" };
  }
}

/** Logout → limpia sesión */
export function logout() {
  auth.limpiarSesion();
}

/** Perfil (protegido) */
export async function getUsuarioPerfil() {
  const client = getClient({ force: "protected" });
  return client.get("usuario/me/");
}

/** Update usuario (protegido) — renombrado para no chocar con updateUsuario */
export async function updateUsuarioCuenta(id, payload) {
  const client = getClient({ force: "protected" });
  return client.put(`usuario/${id}/`, payload);
}

/** Registro (público) */
export async function registerUsuario(payload) {
  const client = getClient({ force: "public" });
  return client.post("usuario/register/", payload);
}

/** Recuperar password (público) */
export async function recuperarPassword(payload) {
  const client = getClient({ force: "public" });
  return client.post("usuario/recuperar_password/", payload);
}
