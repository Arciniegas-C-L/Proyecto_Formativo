import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient";  // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* --- selector de cliente: respeta tu sesión/rol --- */
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  if (options.force === "public") return publicApi;     // obligar público
  if (options.force === "protected") return api;        // obligar protegido
  return token ? api : publicApi;                       // auto por token
}

/* ================== Usuarios (módulo extra) ================== */
// (normalmente protegido)
export const getUsuarios = () =>
  getClient({ force: "protected" }).get("usuarios/");

export const updateUsuario = (id, payload) =>
  getClient({ force: "protected" }).put(`usuarios/${id}/`, payload);

/* ============== CRUD de GRUPO TALLA ============== */
/* Lecturas públicas; escrituras protegidas           */

// Obtener todos los grupos de talla (PÚBLICO)
export const getAllGruposTalla = async () => {
  try {
    const response = await getClient({ force: "public" }).get("grupo-talla/");
    const gruposTalla = (response.data || []).map((grupo) => ({
      ...grupo,
      Tallas: grupo.tallas || [],
    }));
    return { ...response, data: gruposTalla };
  } catch (error) {
    console.error("Error al obtener grupos de talla:", error);
    throw error;
  }
};

// Obtener un grupo por ID (PÚBLICO)
export const getGrupoTallaById = async (id) => {
  try {
    const response = await getClient({ force: "public" }).get(`grupo-talla/${id}/`);
    return {
      ...response,
      data: {
        ...response.data,
        Tallas: response.data?.tallas || [],
      },
    };
  } catch (error) {
    console.error("Error al obtener grupo de talla:", error);
    throw error;
  }
};

// Crear grupo de talla (PROTEGIDO)
export const createGrupoTalla = (data) =>
  getClient({ force: "protected" }).post("grupo-talla/", data);

// Actualizar grupo de talla (PROTEGIDO)
export const updateGrupoTalla = (id, data) =>
  getClient({ force: "protected" }).put(`grupo-talla/${id}/`, data);

// Eliminar grupo de talla (PROTEGIDO)
export const deleteGrupoTalla = (id) =>
  getClient({ force: "protected" }).delete(`grupo-talla/${id}/`);

// Cambiar estado activo/inactivo (PROTEGIDO)
export const cambiarEstadoGrupoTalla = (id, estado) =>
  getClient({ force: "protected" }).patch(`grupo-talla/${id}/cambiar_estado/`, { estado });

/* ------- Extra: Tallas por grupo ------- */

// Listar solo tallas activas de un grupo (PÚBLICO: solo lectura)
export const getTallasActivasByGrupo = async (id) => {
  try {
    const response = await getClient({ force: "public" }).get(`grupo-talla/${id}/tallas_activas/`);
    return response;
  } catch (error) {
    console.error("Error al obtener tallas activas del grupo:", error);
    throw error;
  }
};

// Agregar una talla a un grupo (PROTEGIDO)
export const agregarTallaToGrupo = async (id, talla) => {
  try {
    const response = await getClient({ force: "protected" }).post(`grupo-talla/${id}/agregar_talla/`, talla);
    return response;
  } catch (error) {
    console.error("Error al agregar talla al grupo:", error);
    throw error;
  }
};
