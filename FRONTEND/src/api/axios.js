// src/api/axios.js
import axios from "axios";
import { auth } from "../auth/authService"; // ya lo tienes
import { guest } from "./AuthApi"; // lo crearemos abajo

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/BACKEND/api/",
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;

    // Si aún así llega un 403 de carrito, devuelve un OK vacío
    if (status === 403 && error?.config?.url?.includes("carrito")) {
      return Promise.resolve({ data: { results: [], count: 0 } });
    }

    return Promise.reject(error);
  }
);

// ---------- Interceptor de REQUEST: token + rol ----------
api.interceptors.request.use(
  (config) => {
    try {
      const token = auth.obtenerToken?.();   // tu helper
      const rol = auth.obtenerRol?.();       // tu helper

      if (token && token.trim() !== "") {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // si usas un header para el rol, mantenlo:
      if (rol && rol.trim() !== "") {
        config.headers["X-Rol"] = rol;
      }
    } catch (err) {
      console.warn("Error leyendo sesión en request:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Interceptor de RESPONSE: 401 => pedir guest() y reintentar ----------
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si vence o no hay token y este request no fue reintentado:
    if (error?.response?.status === 401 && !original?._retry) {
      original._retry = true;

      try {
        // Evita múltiples guest() simultáneos
        if (!isRefreshing) {
          isRefreshing = true;
          await guest(); // pide token invitado y lo guarda via authService
          isRefreshing = false;
        }

        // reinyecta el nuevo token y reintenta
        const newToken = auth.obtenerToken?.();
        if (newToken) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      } catch (e) {
        isRefreshing = false;
        auth.limpiarSesion?.();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
