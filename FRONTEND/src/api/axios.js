// src/api/axios.js
import axios from "axios";
import { auth } from "../auth/authService"; // helper de sesión

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/BACKEND/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- Interceptor de REQUEST: token + rol ----------
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
    } catch (err) {
      console.warn("Error leyendo sesión en request:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Interceptor de RESPONSE ----------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // Mantienes la lógica: si carrito devuelve 403, responder vacío
    if (status === 403 && url.includes("carrito")) {
      return Promise.resolve({ data: { results: [], count: 0 } });
    }

    // Sin guest: si 401, limpiar sesión y propagar error
    if (status === 401) {
      try {
        auth.limpiarSesion?.();
      } catch {error}
      // Opcional: podrías redirigir a /login aquí si usas react-router
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
