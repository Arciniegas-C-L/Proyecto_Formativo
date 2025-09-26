// src/api/Producto.api.js
import { clientForResource } from "./clientSelector";

// helpers de cliente (lecturas pueden ir públicas; escrituras protegidas)
const cProdRead  = () => clientForResource("producto").client;
const cProdWrite = () => clientForResource("producto", { force: "protected" }).client;
const cUser      = () => clientForResource("usuario",  { force: "protected" }).client;

// Usuarios (si aplica en este módulo) — router 'usuario' (singular)
export const getUsuarios = () => cUser().get("usuario/");
export const updateUsuario = (id, payload) => cUser().put(`usuario/${id}/`, payload);

/* ----------------------------- PRODUCTOS ----------------------------- */

// Obtener todos los productos (PÚBLICO si no hay token; protegido si hay token)
export const getALLProductos = async () => {
  try {
    const response = await cProdRead().get("producto/");
    return response;
  } catch (error) {
    handleProductoError(error);
  }
};

// Crear un nuevo producto (PROTEGIDO)
export const createProducto = async (formData) => {
  try {
    return await cProdWrite().post("producto/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    console.error(" Backend respondió:", error?.response?.data);
    handleProductoError(error);
    throw error;
  }
};

// Eliminar un producto por ID (PROTEGIDO)
export const deleteProducto = async (id) => {
  try {
    return await cProdWrite().delete(`producto/${id}/`);
  } catch (error) {
    console.error("Error en deleteProducto:", error);
    handleProductoError(error);
  }
};

// Actualizar un producto por ID (PROTEGIDO)
export const updateProducto = async (id, producto) => {
  try {
    let formData = producto instanceof FormData ? producto : new FormData();
    if (!(producto instanceof FormData)) {
      for (const key in producto) {
        if (producto[key] !== undefined && producto[key] !== null) {
          formData.append(key, producto[key]);
        }
      }
    }
    return await cProdWrite().put(`producto/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    console.error(" Backend al actualizar:", error?.response?.data);
    handleProductoError(error);
    throw error;
  }
};

/* ----------------------------- CATEGORÍAS ----------------------------- */

const cCategoriaRead = () => clientForResource("categoria").client;

// Obtener todas las categorías (público si no hay token)
export const getCategorias = async () => {
  try {
    return await cCategoriaRead().get("categoria/");
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};

/* ----------------------------- SUBCATEGORÍAS ----------------------------- */

const cSubcatRead = () => clientForResource("subcategoria").client;

// Obtener subcategorías por ID de categoría (público si no hay token)
export const getSubcategoriasPorCategoria = async (idCategoria) => {
  try {
    return await cSubcatRead().get("subcategoria/", {
      params: { categoria: idCategoria },
    });
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

/* ----------------------------- MANEJO DE ERRORES ----------------------------- */
function handleProductoError(error) {
  if (error?.response) {
    const status = error.response.status;
    if (status === 404) {
      throw new Error(
        "El producto no fue encontrado (revisa la baseURL y si este endpoint es público o protegido)"
      );
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
