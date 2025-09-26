import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/BACKEND/api/usuario/";

export const solicitarCodigo = async (correo) => {
  const res = await axios.post(`${API_URL}recuperar_password/`, { correo });
  return res.data;
};

export const verificarCodigo = async (correo, codigo) => {
  const res = await axios.post(`${API_URL}verificar_codigo/`, { correo, codigo });
  return res.data;
};

export const resetPassword = async (correo, codigo, nueva_contrasena) => {
  const res = await axios.post(`${API_URL}reset_password/`, { correo, codigo, nueva_contrasena });
  return res.data;
};
