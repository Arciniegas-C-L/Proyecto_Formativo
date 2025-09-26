// src/api/TallaApi.js
import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* ---------------- Helpers de selección ---------------- */

// Lecturas: auto según sesión + fallback de público→protegido si hay token
function clientForReadAuto() {
  const token = auth.obtenerToken?.();
  return token ? api : publicApi;
}

// Escrituras protegidas (mantengo tu control de rol en front)
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

// Helper de lectura con fallback (público → protegido si 401 y hay token)
async function readWithFallback(path, config) {
  const hasToken = !!auth.obtenerToken?.();
  const primary = clientForReadAuto();
  try {
    const res = await primary.get(path, config);
    return res.data;
  } catch (e) {
    if (!hasToken || e?.response?.status !== 401) throw e;
    // reintentar con api autenticado
    const res2 = await api.get(path, config);
    return res2.data;
  }
}

/* ---------------- Usuarios (protegido) ---------------- */
// (corrijo endpoint a singular 'usuario/')
export const getUsuarios   = () => clientForWrite(["admin", "empleado"]).get("usuario/").then(r => r.data);
export const updateUsuario = (id, payload) =>
  clientForWrite(["admin"]).put(`usuario/${id}/`, payload).then(r => r.data);

/* =================== API DE TALLA =================== */
/* LECTURAS: auto + fallback | ESCRITURAS: protegido  */

// Obtener todas las tallas (LECTURA auto + fallback)
export const getAllTallas = async () => {
  const data = await readWithFallback("talla/");
  return data;
};

// Obtener una talla por ID (LECTURA auto + fallback)
export const getTallaById = async (id) => {
  const data = await readWithFallback(`talla/${id}/`);
  return data;
};

// Tallas por grupo (LECTURA auto + fallback)
export const getTallasByGrupo = async (grupoId) => {
  const data = await readWithFallback("talla/", { params: { grupo: grupoId } });
  return data;
};

// Tallas activas (LECTURA auto + fallback)
export const getTallasActivas = async () => {
  const data = await readWithFallback("talla/", { params: { estado: true } });
  return data;
};

// Crear talla (PROTEGIDO)
export const createTalla = (payload) =>
  clientForWrite().post("talla/", payload).then(r => r.data);

// Actualizar talla (PROTEGIDO)
export const updateTalla = (id, payload) =>
  clientForWrite().put(`talla/${id}/`, payload).then(r => r.data);

// Eliminar talla (PROTEGIDO)
export const deleteTalla = (id) =>
  clientForWrite().delete(`talla/${id}/`).then(r => r.data);

// Cambiar estado (PROTEGIDO)
export const cambiarEstadoTalla = (id, estado) =>
  clientForWrite().patch(`talla/${id}/cambiar_estado/`, { estado }).then(r => r.data);

// Agregar talla a productos existentes (PROTEGIDO)
export const agregarTallaAProductosExistentes = async (tallaId) => {
  try {
    const res = await clientForWrite().post(
      "talla/agregar_talla_a_productos_existentes/",
      { talla_id: tallaId }
    );
    return res.data;
  } catch (error) {
    console.error("Error al agregar talla a productos existentes:", error);
    throw error;
  }
};
