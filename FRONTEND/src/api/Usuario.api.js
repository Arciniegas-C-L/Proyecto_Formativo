// src/api/Usuario.api.js
import { api } from './client';

export const registerUsuario = (usuario) => api.post('usuario/register/', usuario);

export const loginUsuario = (credenciales) => api.post('usuario/login/', credenciales);

export const solicitarRecuperacion = (payload) => api.post('usuario/recuperar_contrasena/', payload);

export const resetearContrasena = (payload) => api.post('usuario/reset_password/', payload);

export const fetchUsuario = () => api.get('usuario/');

export const updateUsuario = (id, payload) => api.put(`usuario/${id}/`, payload);

export const handleToggleEstado = (id, estadoActual) => {
  return api.patch(`usuario/${id}/`, { estado: !estadoActual });
};

export const getUsuarios = () => api.get('usuario/usuarios/');
