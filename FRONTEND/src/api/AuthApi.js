// src/api/AuthApis.js
import api from "./axios";
import { auth } from "../auth/authService";
import {publicApi} from "./publicClient";

// LOGIN normal
export async function login(email, password) {
  try {
    const response = await api.post("api/usuario/login/", {
      correo: email,
      password,
    });

    const data = response.data;
    // guarda sesión igual que ya haces en tu app
    auth.guardarSesion({
      access: data?.token?.access,
      refresh: data?.token?.refresh,
      usuario: data?.usuario,
      rol: data?.rol || data?.usuario?.rol,
      guest: false,
    });

    return data;
  } catch (error) {
    throw error?.response?.data || { error: "Error inesperado al iniciar sesión" };
  }
}

// NUEVO: token invitado
export async function guest() {
  const { data } = await publicApi.post("usuario/guest/"); // ruta de tu @action guest
  auth.guardarSesion({
    access: data?.token?.access,
    refresh: data?.token?.refresh, // si no envías refresh en invitados, omítelo
    usuario: data?.usuario,
    rol: data?.rol || data?.usuario?.rol, // "Invitado"
    guest: true,
  });
  return data;
}

// LOGOUT
export function logout() {
  auth.limpiarSesion();
}
