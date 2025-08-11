// src/api/publicClient.js
import axios from 'axios';

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/BACKEND/',
});
// No se inyecta token en peticiones públicas