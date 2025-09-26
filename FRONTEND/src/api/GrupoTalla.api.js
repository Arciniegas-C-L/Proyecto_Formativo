import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* --- selector de cliente: respeta tu sesión/rol --- */
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  if (options.force === "public")    return publicApi; // obligar público
  if (options.force === "protected") return api;       // obligar protegido
  return token ? api : publicApi;                      // auto por token
}

/* ================== Usuarios (módulo extra) ================== */
/* Nota: revisa si tu backend usa 'usuario/' (singular).
   Si es singular, cambia ambos endpoints a 'usuario/'. */
export const getUsuarios = () =>
  getClient({ force: "protected" }).get("usuario/").then(r => r.data);

export const updateUsuario = (id, payload) =>
  getClient({ force: "protected" }).put(`usuario/${id}/`, payload).then(r => r.data);

/* ============== CRUD de GRUPO TALLA ============== */
/* Lecturas públicas; escrituras protegidas           */

// Obtener todos los grupos de talla (PÚBLICO) → devuelve ARRAY
export const getAllGruposTalla = async () => {
  const hasToken = !!auth.obtenerToken?.();
  try {
    const client = hasToken ? api : publicApi;
    const res = await client.get("grupo-talla/");
    return (res.data || []).map(g => ({ ...g, Tallas: g.tallas || [] }));
  } catch (e) {
    // Por si el público está cerrado en backend, reintenta con token
    if (!hasToken && e?.response?.status === 401 && auth.obtenerToken?.()) {
      const res2 = await api.get("grupo-talla/");
      return (res2.data || []).map(g => ({ ...g, Tallas: g.tallas || [] }));
    }
    throw e;
  }
};

// Obtener un grupo por ID (PÚBLICO) → devuelve OBJETO normalizado
export const getGrupoTallaById = async (id) => {
  try {
    const res = await getClient({ force: "public" }).get(`grupo-talla/${id}/`);
    const g = res.data || {};
    return { ...g, Tallas: g.tallas || [] }; // <- objeto directo
  } catch (error) {
    console.error("Error al obtener grupo de talla:", error);
    throw error;
  }
};

// Crear grupo de talla (PROTEGIDO)
export const createGrupoTalla = (data) =>
  getClient({ force: "protected" }).post("grupo-talla/", data).then(r => r.data);

// Actualizar grupo de talla (PROTEGIDO)
export const updateGrupoTalla = (id, data) =>
  getClient({ force: "protected" }).put(`grupo-talla/${id}/`, data).then(r => r.data);

// Eliminar grupo de talla (PROTEGIDO)
export const deleteGrupoTalla = (id) =>
  getClient({ force: "protected" }).delete(`grupo-talla/${id}/`).then(r => r.data);

// Cambiar estado activo/inactivo (PROTEGIDO)
export const cambiarEstadoGrupoTalla = (id, estado) =>
  getClient({ force: "protected" })
    .patch(`grupo-talla/${id}/cambiar_estado/`, { estado })
    .then(r => r.data);

/* ------- Extra: Tallas por grupo ------- */

// Listar solo tallas activas de un grupo (PÚBLICO)
export const getTallasActivasByGrupo = async (id) => {
  try {
    const res = await getClient({ force: "public" }).get(`grupo-talla/${id}/tallas_activas/`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener tallas activas del grupo:", error);
    throw error;
  }
};

// Agregar una talla a un grupo (PROTEGIDO)
export const agregarTallaToGrupo = async (id, talla) => {
  try {
    const res = await getClient({ force: "protected" }).post(`grupo-talla/${id}/agregar_talla/`, talla);
    return res.data;
  } catch (error) {
    console.error("Error al agregar talla al grupo:", error);
    throw error;
  }
};
