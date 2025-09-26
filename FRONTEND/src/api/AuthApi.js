import { auth } from "../auth/authService";
import api from "./axios";
import publicApi from "./publicClient";

/**
 * Devuelve el cliente correcto:
 *  - Si no hay token → público
 *  - Si hay token → protegido
 *  - Si pasas { force: "public" | "protected" } fuerza ese cliente
 */
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  const logged = !!(token && token.trim() !== "");

  if (options.force === "public") return publicApi;
  if (options.force === "protected") return api;

  return logged ? api : publicApi;
}

/**
 * Login → siempre público (sin token)
 */
export async function login(email, password) {
  try {
    const client = getClient({ force: "public" }); // siempre público
    const response = await client.post("usuario/login/", {
      correo: email,
      password,
    });

    const data = response.data;

    // Guardamos sesión
    auth.guardarSesion({
      access: data?.token?.access,
      refresh: data?.token?.refresh,
      usuario: data?.usuario,
      rol: data?.rol || data?.usuario?.rol,
    });

    return data;
  } catch (error) {
    console.error("Login error:", error?.response?.status, error?.response?.data);
    throw error?.response?.data || { error: "Error inesperado al iniciar sesión" };
  }
}

/**
 * Logout → limpia sesión
 */
export function logout() {
  auth.limpiarSesion();
}

/**
 * Fetch perfil del usuario → protegido
 */
export async function getUsuarioPerfil() {
  const client = getClient({ force: "protected" });
  return client.get("usuario/me/");
}

/**
 * Update usuario → protegido
 */
export async function updateUsuario(id, payload) {
  const client = getClient({ force: "protected" });
  return client.put(`usuario/${id}/`, payload);
}

/**
 * Registro → público
 */
export async function registerUsuario(payload) {
  const client = getClient({ force: "public" });
  return client.post("usuario/register/", payload);
}

/**
 * Recuperar password → público
 */
export async function recuperarPassword(payload) {
  const client = getClient({ force: "public" });
  return client.post("usuario/recuperar_password/", payload);
}
