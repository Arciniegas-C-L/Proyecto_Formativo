// src/api/Recuperacion.api.js (o el nombre que uses para este módulo)
import { publicApi } from "./publicClient"; // ← PÚBLICO (sin token)

// Base pública (coincide con tus urls.py)
const BASE = "usuario/";

// En estos 3 casos NO hace falta chequear rol: siempre es público
export const solicitarCodigo = async (correo) => {
  const res = await publicApi.post(`${BASE}recuperar_password/`, { correo });
  return res.data;
};

export const verificarCodigo = async (correo, codigo) => {
  const res = await publicApi.post(`${BASE}verificar_codigo/`, { correo, codigo });
  return res.data;
};

export const resetPassword = async (correo, codigo, nueva_contrasena) => {
  const res = await publicApi.post(`${BASE}reset_password/`, { correo, codigo, nueva_contrasena });
  return res.data;
};
