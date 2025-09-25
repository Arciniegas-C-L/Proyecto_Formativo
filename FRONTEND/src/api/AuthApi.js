// src/api/AuthApis.js
import api from "./axios";
import { auth } from "../auth/authService";

// LOGIN normal
export async function login(email, password) {
  try {
    const response = await api.post("usuario/login/", { // <-- sin "api/"
      correo: email, // si tu backend espera "email", cámbialo aquí
      password,
    });

    const data = response.data;

    auth.guardarSesion({
      access: data?.token?.access,
      refresh: data?.token?.refresh,
      usuario: data?.usuario,
      rol: data?.rol || data?.usuario?.rol,
    });

    return data;
  } catch (error) {
    // Útil para ver el motivo exacto del 400
    console.error("Login error:", error?.response?.status, error?.response?.data);
    throw error?.response?.data || { error: "Error inesperado al iniciar sesión" };
  }
}

// LOGOUT
export function logout() {
  auth.limpiarSesion();
}
