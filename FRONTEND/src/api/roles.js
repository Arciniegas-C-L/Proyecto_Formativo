// src/api/axios.js
import axios from "axios";
import { auth } from "../auth/authService";
import { toast } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/BACKEND/";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ========== Helper interno para pedir token invitado (SIN ciclos de importación) ==========
const plain = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });

async function requestGuestToken() {
  // OJO: usa la ruta real que expone tu @action guest (ajusta si es "api/usuarios/guest/")
  const { data } = await plain.post("usuarios/guest/");
  // Guarda sesión igual que en login (ajusta a tu authService real)
  auth.guardarSesion({
    access: data?.token?.access,
    refresh: data?.token?.refresh, // si no devuelves refresh para invitados, no lo guardes
    usuario: data?.usuario,
    rol: data?.rol || data?.usuario?.rol,
    guest: true,
  });
  return data;
}

// ========== Interceptor REQUEST: token + rol ==========
api.interceptors.request.use(
  (config) => {
    try {
      const token = auth.obtenerToken?.();
      const rol = auth.obtenerRol?.();

      if (token && token.trim() !== "") {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (rol && rol.trim() !== "") {
        config.headers["X-Rol"] = rol;
      }
    } catch (error) {
      console.warn("Error en autenticación (request):", error);
    }
    return config;
  },
  (error) => {
    console.error("Request fallido:", error);
    return Promise.reject(error);
  }
);

// ========== Interceptor RESPONSE: 403 toast, 401 => guest + reintento ==========
let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    // 403: sin permisos según rol
    if (status === 403) {
      const rol = auth.obtenerRol?.();
      console.warn(`Acceso prohibido para el rol: ${rol}`);
      toast.error(`No tienes acceso con el rol "${rol ?? "desconocido"}".`);
      return Promise.reject(error);
    }

    // 401: token inválido/expirado -> pedir invitado y reintentar UNA vez
    if (status === 401 && original && !original._retry) {
      original._retry = true;

      try {
        // Evitar llamar varias veces a la vez
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = requestGuestToken()
            .catch((e) => {
              // Si falla, limpia sesión para evitar bucles
              auth.limpiarSesion?.();
              throw e;
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        await refreshPromise;

        // Reinyectar nuevo token y reintentar
        const newToken = auth.obtenerToken?.();
        if (newToken) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(original);
      } catch (e) {
        // Si sigue fallando, propaga
        return Promise.reject(e);
      }
    }

    // Otros errores: propagar
    return Promise.reject(error);
  }
);

export default api;
