// src/api/roles.js
import axios from 'axios';
import { auth } from '../auth/authService';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/BACKEND/',
});

// Interceptor de request: token + rol
api.interceptors.request.use(
  (config) => {
    try {
      const token = auth.obtenerToken();
      const rol = auth.obtenerRol(); // 👈 función que tú defines

      if (token && typeof token === 'string' && token.trim() !== '') {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (rol) {
        config.headers['X-Rol'] = rol; // 👈 opcional, si tu backend lo usa
      }
    } catch (error) {
      console.warn('Error en autenticación:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: manejo por rol
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};
    const rol = auth.obtenerRol();

    if (status === 403) {
      console.warn(`Acceso prohibido para el rol: ${rol}`);
      console.error('Credenciales invalidas:', error);
    }

    return Promise.reject(error);
  }
);
