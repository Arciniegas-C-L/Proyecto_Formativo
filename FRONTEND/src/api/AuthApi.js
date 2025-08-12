// src/api/AuthApi.js
import { api } from './roles'; // 👈 reemplaza axiosInstance

export async function login(email, password) {
  try {
    const response = await api.post('api/usuario/login/', {
      correo: email,
      password,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error inesperado al iniciar sesión' };
  }
}
