// src/api/client.js
import axios from 'axios';
import { auth } from '../auth/authService';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/BACKEND/',
});

// Inyecta el token en cada request
api.interceptors.request.use((config) => {
  const token = auth.obtenerToken(); // ✅ función correcta
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
