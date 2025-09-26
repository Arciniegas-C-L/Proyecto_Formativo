// src/api/Producto.api.js
import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService"; // para decidir según token/rol

// ===== Helpers de selección (no cambian firmas públicas) =====
const hasToken = () => {
  const t = auth.obtenerToken?.();
  return !!(t && String(t).trim() !== "");
};
const getRol = () => (auth.obtenerRol?.() ?? "").toString().toLowerCase();
const isPublicRole = () => !hasToken() || ["invitado", "viewer", "guest", ""].includes(getRol());

// Lecturas de catálogo → público si invitado, protegido si autenticado
const clientCatalogRead = () => (isPublicRole() ? publicApi : api);
const clientTaxonomyRead = () => (isPublicRole() ? publicApi : api);

// ===== Usuarios (si aplica en este módulo) — router 'usuario' (singular) =====
export const getUsuarios = () => api.get("usuario/");
export const updateUsuario = (id, payload) => api.put(`usuario/${id}/`, payload);

/* ----------------------------- PRODUCTOS ----------------------------- */

// Obtener todos los productos (dinámico: público si invitado, protegido si autenticado)
export const getALLProductos = async () => {
  try {
    const response = await clientCatalogRead().get("producto/");
    return response; // Conserva tu firma: devuelve AxiosResponse
  } catch (error) {
    handleProductoError(error);
  }
};

// Crear un nuevo producto (PROTEGIDO)
export const createProducto = async (formData) => {
  try {
    return await api.post("producto/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    console.error(" Backend respondió:", error.response?.data);
    handleProductoError(error);
    throw error;
  }
};

// Eliminar un producto por ID (PROTEGIDO)
export const deleteProducto = async (id) => {
  try {
    return await api.delete(`producto/${id}/`);
  } catch (error) {
    console.error("Error en deleteProducto:", error);
    handleProductoError(error);
  }
};

// Actualizar un producto por ID (PROTEGIDO)
export const updateProducto = async (id, producto) => {
  try {
    let formData;
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
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    console.error(" Backend al actualizar:", error.response?.data);
    handleProductoError(error);
    throw error;
  }
};

/* ----------------------------- CATEGORÍAS ----------------------------- */

// Obtener todas las categorías (dinámico)
export const getCategorias = async () => {
  try {
    return await clientTaxonomyRead().get("categoria/");
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};

/* ----------------------------- SUBCATEGORÍAS ----------------------------- */

// Obtener subcategorías por ID de categoría (dinámico)
export const getSubcategoriasPorCategoria = async (idCategoria) => {
  try {
    return await clientTaxonomyRead().get("subcategoria/", {
      params: { categoria: idCategoria },
    });
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

/* ----------------------------- PEDIDO ITEMS ----------------------------- */
/* OJO: Si mantienes esta función aquí, cambia el import en MisPedidos.jsx a:
   import { listarItemsDePedido } from "../../api/Producto.api.js";
   Si prefieres dejar el import antiguo, usa la opción B de abajo y borra esta función de aquí. */
export const listarItemsDePedido = (pedidoId, params = {}) => {
  return api.get("pedidoproductos/", { params: { pedido: pedidoId, ...params } });
};

/* ----------------------------- MANEJO DE ERRORES ----------------------------- */
function handleProductoError(error) {
  if (error?.response) {
    const status = error.response.status;
    if (status === 404) {
      throw new Error("El recurso no fue encontrado (revisa baseURL y si el endpoint es público o protegido)");
    }
    if (status === 500) {
      throw new Error("Error interno del servidor. Por favor, intente más tarde");
    }
    throw new Error(
      error.response.data?.detail ||
      error.response.data?.message ||
      "Error al procesar la solicitud"
    );
  } else if (error?.request) {
    throw new Error("No se pudo conectar con el servidor");
  } else {
    throw new Error("Error al procesar la solicitud");
  }
}
