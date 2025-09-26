import { auth } from "../auth/authService";
import { api } from "./axios";          // PROTEGIDO  → /BACKEND/api/...
import { publicApi } from "./publicClient"; // PÚBLICO → /BACKEND/...

/* ---------------------- helper: elegir cliente ---------------------- */
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  const logged = !!(token && token.trim() !== "");

  if (options.force === "public") return publicApi;     // fuerza público
  if (options.force === "protected") return api;        // fuerza protegido
  return logged ? api : publicApi;                      // auto
}

/* ---------------------- helper: chequear rol ------------------------ */
function assertRole(rolesPermitidos = []) {
  if (!rolesPermitidos?.length) return; // nada que validar
  const rol = auth.obtenerRol?.();
  if (!rol || !rolesPermitidos.map(String).includes(String(rol))) {
    const e = new Error("No autorizado: rol insuficiente");
    e.code = "ROLE_FORBIDDEN";
    throw e;
  }
}

/* ---------------------- ENDPOINTS PÚBLICOS ---------------------- */
// De acuerdo a tus rutas, estos SIEMPRE son públicos
export const registerUsuario = (usuario) =>
  getClient({ force: "public" }).post("usuario/register/", usuario);

export const loginUsuario = (credenciales) =>
  getClient({ force: "public" }).post("usuario/login/", credenciales);

export const solicitarRecuperacion = (payload) =>
  getClient({ force: "public" }).post("usuario/recuperar_password/", payload);

export const resetearContrasena = (payload) =>
  getClient({ force: "public" }).post("usuario/reset_password/", payload);

export const verificarCodigoUsuario = (payload) =>
  getClient({ force: "public" }).post("usuario/verificar_codigo/", payload);

/* ---------------------- ENDPOINTS PROTEGIDOS ---------------------- */
// Estos deben ir contra /BACKEND/api/... y requieren token

export const fetchUsuario = () =>
  getClient({ force: "protected" }).get("usuario/me/");

// Si solo ciertos roles pueden actualizar usuarios, descomenta y ajusta:
// assertRole(["admin", "cliente"]) // ejemplo
export const updateUsuario = (id, payload) => {
  // ejemplo: permitir solo admin o el mismo usuario (valídalo si quieres)
  // assertRole(["admin"]);
  return getClient({ force: "protected" }).put(`usuario/${id}/`, payload);
};

export const handleToggleEstado = (id, estadoActual) => {
  // ejemplo: normalmente esto es de admin
  // assertRole(["admin"]);
  return getClient({ force: "protected" }).patch(`usuario/${id}/`, {
    estado: !estadoActual,
  });
};

// Listado de usuarios suele ser solo admin; valida si quieres
export const getUsuarios = () => {
  // assertRole(["admin"]);
  return getClient({ force: "protected" }).get("usuario/");
};
