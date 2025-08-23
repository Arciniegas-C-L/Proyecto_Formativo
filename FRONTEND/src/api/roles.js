import axios from 'axios';
import { auth } from '../auth/authService';
import { toast } from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/BACKEND/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: token + rol
api.interceptors.request.use(
  (config) => {
    try {
      const token = auth.obtenerToken();
      const rol = auth.obtenerRol?.();

      if (token && token.trim() !== '') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (rol && rol.trim() !== '') {
        config.headers['X-Rol'] = rol;
      }
    } catch (error) {
      console.warn('🔒 Error en autenticación (request):', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request fallido:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta con manejo por rol + errores + toast
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const { status, data } = error.response || {};
      const rol = auth.obtenerRol?.();

      if (status === 403) {
        console.warn(`⛔ Acceso prohibido para el rol: ${rol}`);
        console.error('Detalles del error (403):', error);
        toast.error(`No tienes acceso con el rol "${rol}".`);
      }

      // Placeholder para 401 / refresh token
      // if (status === 401) { ... }

    } catch (e) {
      console.error('💥 Error inesperado en interceptor (response):', e);
      toast.error('Ocurrió un error inesperado en la respuesta.');
    }

    return Promise.reject(error);
  }
);
