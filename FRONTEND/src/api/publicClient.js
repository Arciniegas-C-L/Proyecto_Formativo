// src/api/publicClient.js
import axios from 'axios';

export const publicApi = axios.create({
  baseURL: 'http://localhost:8000/BACKEND/', // Ajusta según tu backend
  headers: {
    'Content-Type': 'application/json',
  },
});
