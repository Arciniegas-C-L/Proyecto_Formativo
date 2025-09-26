// src/api/Comentarios.api.js
import { api } from "./axios";              // protegido (/BACKEND/api/…)
import { publicApi } from "./publicClient"; // público   (/BACKEND/…)
import { auth } from "../auth/authService";

// Helpers rol/token
const getRol = () => (auth.obtenerRol?.() || "").toLowerCase();
const hasToken = () => {
  const t = auth.obtenerToken?.();
  return !!(t && t.trim() !== "");
};

// Comentarios: público si invitado/viewer o sin token; protegido si hay token (admin/cliente/moderador)
const commentsClient = () => {
  const rol = getRol();
  const logged = hasToken();
  const publicRoles = new Set(["", "invitado", "viewer", "guest", null, undefined]);
  return logged && !publicRoles.has(rol) ? api : publicApi;
};

// Crear comentario (usa el cliente según rol/token)
export const enviarComentario = (data) =>
  commentsClient().post("comentarios/", data);

// Listar comentarios:
//   - usa el cliente según rol/token
//   - si fue el protegido y devuelve 404, reintenta por el público
export const obtenerComentarios = async (params = {}) => {
  const client = commentsClient();
  try {
    return await client.get("comentarios/", { params });
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 && client !== publicApi) {
      // fallback: público (útil si el router público está en /BACKEND/ y el protegido no)
      return await publicApi.get("comentarios/", { params });
    }
    throw err;
  }
};
