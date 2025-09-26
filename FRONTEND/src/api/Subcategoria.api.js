// src/api/SubcategoriaApi.js
import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* ---------------- Selector de cliente ---------------- */
// - Si pasas { force: "public" | "protected" } fuerza ese cliente
// - Si no, elige por token (logueado → api; no logueado → publicApi)
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  if (options.force === "public")    return publicApi;
  if (options.force === "protected") return api;
  return token ? api : publicApi;
}

/* ---------------- Usuarios (protegido) ---------------- */
// OJO: si tu backend usa 'usuarios/' en plural, cambia aquí.
export const getUsuarios = () =>
  getClient({ force: "protected" }).get("usuario/").then(r => r.data);

export const updateUsuario = (id, payload) =>
  getClient({ force: "protected" }).put(`usuario/${id}/`, payload).then(r => r.data);

/* ---------------------- SUBCATEGORÍAS ---------------------- */

// Obtener todas las subcategorías (PÚBLICO)
export const getAllSubcategorias = async () => {
  try {
    const res = await getClient({ force: "public" }).get("subcategoria/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error?.response?.data || error);
    throw error;
  }
};

// Obtener subcategorías por categoría (PÚBLICO) con fallback
// 1) /subcategoria/por_categoria/?categoria=ID
// 2) si 404 → /subcategoria/?categoria=ID
export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await getClient({ force: "public" }).get("subcategoria/por_categoria/", {
      params: { categoria: categoriaId },
    });
    return res.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const res2 = await getClient({ force: "public" }).get("subcategoria/", {
          params: { categoria: categoriaId },
        });
        return res2.data;
      } catch (e2) {
        console.error("Fallback subcategoria/?categoria=... también falló:", e2?.response?.data || e2);
        throw e2;
      }
    }
    console.error("Error al obtener subcategorías por categoría:", error?.response?.data || error);
    throw error;
  }
};

// Crear una nueva subcategoría (PROTEGIDO)
export const createSubcategoria = async (subcategoria) => {
  try {
    const res = await getClient({ force: "protected" }).post("subcategoria/", subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al crear subcategoría:", error?.response?.data || error);
    throw error;
  }
};

// Actualizar una subcategoría (PROTEGIDO)
export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await getClient({ force: "protected" }).put(`subcategoria/${id}/`, subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error?.response?.data || error);
    throw error;
  }
};

// Eliminar una subcategoría (PROTEGIDO)
export const deleteSubcategoria = async (id) => {
  try {
    const res = await getClient({ force: "protected" }).delete(`subcategoria/${id}/`);
    return res.data;
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error?.response?.data || error);
    throw error;
  }
};

// Actualizar el grupo de talla de una subcategoría (PROTEGIDO)
export const updateGrupoTalla = async (subcategoriaId, grupoTallaId) => {
  if (!subcategoriaId || !grupoTallaId) {
    throw new Error("Se requieren tanto el ID de la subcategoría como el ID del grupo de talla");
  }

  const grupoTallaIdNum = Number(grupoTallaId);
  if (Number.isNaN(grupoTallaIdNum)) {
    throw new Error("El ID del grupo de talla debe ser un número válido");
    }

  try {
    const res = await getClient({ force: "protected" }).put(
      `subcategoria/${subcategoriaId}/actualizar_grupo_talla/`,
      { grupoTalla: grupoTallaIdNum }
    );
    return res.data;
  } catch (error) {
    const resp = error?.response;
    if (resp?.data?.error) throw new Error(resp.data.error);

    switch (resp?.status) {
      case 400:
        if (resp.data?.error?.includes("ya tiene asignado")) {
          throw new Error("La subcategoría ya tiene asignado este grupo de talla");
        }
        throw new Error(resp.data?.error || "Datos inválidos para la actualización");
      case 404:
        throw new Error("No se encontró la subcategoría o el grupo de talla");
      case 500:
        throw new Error("Error interno del servidor al actualizar el grupo de talla");
      default:
        throw new Error("Error al actualizar el grupo de talla: " + (error.message || "Error desconocido"));
    }
  }
};

// Asignar grupo de talla por defecto a las subcategorías sin grupo (PROTEGIDO)
export const asignarGrupoTallaDefault = async () => {
  try {
    const res = await getClient({ force: "protected" }).post("subcategoria/asignar_grupo_talla_default/");
    return res.data;
  } catch (error) {
    console.error("Error al asignar grupo de tallas por defecto:", error?.response?.data || error.message);
    throw error;
  }
};
