// src/api/publicClient.js
import axios from "axios";

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_PUBLIC ?? "http://localhost:8000/BACKEND/",
  headers: { "Content-Type": "application/json" },
});

// Intencionalmente sin interceptores de auth
export default publicApi;
