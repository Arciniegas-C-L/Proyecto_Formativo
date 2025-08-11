import axiosInstance from './axiosInstance';
// src/api/Usuario.api.js
import { api } from './client';




export async function login(email, password) {
  try {
    const response = await axiosInstance.post(
      'http://127.0.0.1:8000/BACKEND/api/usuario/login/',
      {
        correo: email,
        password,
      }
    );
    
    return response.data;
  } catch (error) {
    // Lanzamos el error hacia el componente para mostrarlo en pantalla
    throw error.response?.data || { error: 'Error inesperado al iniciar sesión' };
  }
}

export const getUsuarios = () => api.get('usuarios/');

