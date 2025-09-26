// src/api/axios.js
import axios from "axios";
import { auth } from "../auth/authService";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL_PROTECTED ?? "http://localhost:8000/BACKEND/api/",
  headers: { "Content-Type": "application/json" },
});

// REQUEST (token + rol)
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

// RESPONSE
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // SOLO para GET de carrito (evita comerte 403 en POST/PUT)
    if (
      status === 403 &&
      url.includes("carrito") &&
      (error?.config?.method || "").toLowerCase() === "get"
    ) {
      return Promise.resolve({ data: { results: [], count: 0 } });
    }

    if (status === 401) {
      try {
        auth.limpiarSesion?.();
      } catch (e) {}
    }

    return Promise.reject(error);
  }
);

export default api;
