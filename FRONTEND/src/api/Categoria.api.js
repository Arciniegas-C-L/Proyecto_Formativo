import { api } from "./axios";              // PROTEGIDO → /BACKEND/api/...
import { publicApi } from "./publicClient";  // PÚBLICO   → /BACKEND/...
import { auth } from "../auth/authService";

/* ---------- helpers locales ---------- */
function getClient(options = {}) {
  const token = auth.obtenerToken?.();
  if (options.force === "public") return publicApi;
  if (options.force === "protected") return api;
  return token ? api : publicApi; // auto
}

function assertRole(roles = []) {
  if (!roles?.length) return;
  const rol = auth.obtenerRol?.();
  if (!rol || !roles.map(String).includes(String(rol))) {
    const e = new Error("No autorizado: rol insuficiente");
    e.code = "ROLE_FORBIDDEN";
    throw e;
  }
}

/* ---------------- CATEGORÍAS ----------------
   - Listar: público
   - Crear/Actualizar/Eliminar: protegido (p. ej. admin)
----------------------------------------------*/

// Obtener todas las categorías (PÚBLICO)
export const getAllCategorias = async () => {
  const res = await getClient({ force: "public" }).get("categoria/");
  return res.data;
};

// Crear una nueva categoría (PROTEGIDO)
export const createCategoria = async (categoria) => {
  // si quieres validar rol desde el front:
  // assertRole(["admin"]);
  const res = await getClient({ force: "protected" }).post("categoria/", categoria);
  return res.data;
};

// Actualizar categoría (PROTEGIDO)
export const updateCategoria = async (id, categoria) => {
  // assertRole(["admin"]);
  const res = await getClient({ force: "protected" }).put(`categoria/${id}/`, categoria);
  return res.data;
};

// Eliminar categoría (PROTEGIDO)
export const deleteCategoria = async (id) => {
  // assertRole(["admin"]);
  await getClient({ force: "protected" }).delete(`categoria/${id}/`);
};

/* -------------- Extra: usuarios -------------- */
// (normalmente protegido)
export const getUsuarios = () =>
  getClient({ force: "protected" }).get("usuarios/"); // 👀 OJO: en tu backend suele ser "usuario/"
