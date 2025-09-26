// src/api/SubcategoriaApi.js
import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* ---------------- Helpers de selección ---------------- */

// Lecturas (GET) → público por defecto
function clientForRead() {
  return publicApi;
}

// Escrituras/acciones protegidas → exige token y rol permitido
function clientForWrite(rolesPermitidos = ["admin", "empleado"]) {
  const token = auth.obtenerToken?.();
  const rol   = auth.obtenerRol?.();

  if (!token) {
    const err = new Error("NO_AUTORIZADO");
    err.status = 401;
    err.detail = "Debe iniciar sesión";
    throw err;
  }
  if (rolesPermitidos.length > 0 && (!rol || !rolesPermitidos.includes(rol))) {
    const err = new Error("NO_PERMISOS");
    err.status = 403;
    err.detail = "No tiene permisos para realizar esta acción";
    throw err;
  }
  return api;
}

/* ---------------- Usuarios (protegido) ---------------- */
// (tu backend expone /usuario/ en singular)
export const getUsuarios   = () => clientForWrite(["admin", "empleado"]).get("usuario/");
export const updateUsuario = (id, payload) =>
  clientForWrite(["admin"]).put(`usuario/${id}/`, payload);

/* ---------------------- SUBCATEGORÍAS ---------------------- */

// Obtener todas las subcategorías (PÚBLICO)
export const getAllSubcategorias = async () => {
  try {
    const res = await clientForRead().get("subcategoria/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error?.response?.data || error);
    throw error;
  }
};

// Obtener subcategorías filtradas por categoría (PÚBLICO)
// Intenta /subcategoria/por_categoria/?categoria=ID y si 404, hace fallback a /subcategoria/?categoria=ID
export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await clientForRead().get("subcategoria/por_categoria/", {
      params: { categoria: categoriaId },
    });
    return res.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const res2 = await clientForRead().get("subcategoria/", {
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
    console.log("Datos a enviar para crear subcategoría:", subcategoria);
    const res = await clientForWrite().post("subcategoria/", subcategoria);
    console.log("Respuesta exitosa:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error al crear subcategoría:", error?.response?.data || error);
    throw error;
  }
};

// Actualizar una subcategoría existente (PROTEGIDO)
export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await clientForWrite().put(`subcategoria/${id}/`, subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error?.response?.data || error);
    throw error;
  }
};

// Eliminar una subcategoría por ID (PROTEGIDO)
export const deleteSubcategoria = async (id) => {
  try {
    await clientForWrite().delete(`subcategoria/${id}/`);
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error?.response?.data || error);
    throw error;
  }
};

// Actualizar el grupo de talla asignado a una subcategoría (PROTEGIDO)
export const updateGrupoTalla = async (subcategoriaId, grupoTallaId) => {
  if (!subcategoriaId || !grupoTallaId) {
    throw new Error("Se requieren tanto el ID de la subcategoría como el ID del grupo de talla");
  }

  const grupoTallaIdNum = Number(grupoTallaId);
  if (isNaN(grupoTallaIdNum)) {
    throw new Error("El ID del grupo de talla debe ser un número válido");
  }

  try {
    const response = await clientForWrite().put(
      `subcategoria/${subcategoriaId}/actualizar_grupo_talla/`,
      { grupoTalla: grupoTallaIdNum }
    );
    return response.data;
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

// Asignar automáticamente un grupo de talla por defecto a todas las subcategorías que no lo tengan (PROTEGIDO)
export const asignarGrupoTallaDefault = async () => {
  try {
    const response = await clientForWrite().post("subcategoria/asignar_grupo_talla_default/");
    return response.data;
  } catch (error) {
    console.error("Error al asignar grupo de tallas por defecto:", error?.response?.data || error.message);
    throw error;
  }
};
