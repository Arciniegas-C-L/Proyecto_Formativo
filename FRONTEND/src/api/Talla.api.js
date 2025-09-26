// src/api/TallaApi.js
import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* ---------------- Helpers de selección ---------------- */

// Para lecturas (endpoints públicos disponibles): usa público por defecto.
// Si hay token y es admin/empleado, igual puedes usar público; pero si prefieres
// forzar protegido para panel interno, cambia el retorno a `api`.
function clientForRead() {
  const token = auth.obtenerToken?.();
  const rol   = auth.obtenerRol?.();
  // puedes forzar protegido para staff si lo prefieres:
  // return token && (rol === "admin" || rol === "empleado") ? api : publicApi;
  return publicApi;
}

// Para escrituras/acciones protegidas con control de rol en front
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
// (corrijo el endpoint a singular 'usuario/')
export const getUsuarios     = () => clientForWrite(["admin", "empleado"]).get("usuario/");
export const updateUsuario   = (id, payload) =>
  clientForWrite(["admin"]).put(`usuario/${id}/`, payload);

/* =================== FUNCIONES PARA LA API DE TALLA =================== */
/* ------ LECTURAS → públicas (sin token). Escrituras → protegidas ------ */

// Obtener todas las tallas (PÚBLICO)
export const getAllTallas = () => clientForRead().get("talla/");

// Obtener una talla específica por su ID (PÚBLICO)
export const getTallaById = (id) => clientForRead().get(`talla/${id}/`);

// Crear una nueva talla (PROTEGIDO)
export const createTalla = (data) => clientForWrite().post("talla/", data);

// Actualizar una talla existente por su ID (PROTEGIDO)
export const updateTalla = (id, data) => clientForWrite().put(`talla/${id}/`, data);

// Eliminar una talla por su ID (PROTEGIDO)
export const deleteTalla = (id) => clientForWrite().delete(`talla/${id}/`);

// Cambiar el estado (activo/inactivo) de una talla (PROTEGIDO)
export const cambiarEstadoTalla = (id, estado) =>
  clientForWrite().patch(`talla/${id}/cambiar_estado/`, { estado });

// Obtener todas las tallas que pertenecen a un grupo específico (PÚBLICO)
export const getTallasByGrupo = (grupoId) =>
  clientForRead().get(`talla/`, { params: { grupo: grupoId } });

// Obtener solo las tallas que están activas (PÚBLICO)
export const getTallasActivas = () =>
  clientForRead().get("talla/", { params: { estado: true } });

// Agregar una talla nueva a todos los productos existentes que usen el mismo grupo (PROTEGIDO)
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
