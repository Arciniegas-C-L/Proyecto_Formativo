
import { api } from './axios';         // Cliente con token
import { publicApi } from './publicClient'; // Cliente sin token


/* ---------------------- ENDPOINTS PÚBLICOS ---------------------- */

export const registerUsuario = (usuario) =>
  publicApi.post('usuario/register/', usuario);

export const loginUsuario = (credenciales) =>
  publicApi.post('usuario/login/', credenciales);

export const solicitarRecuperacion = (payload) =>
  publicApi.post('usuario/recuperar_password/', payload);

export const resetearContrasena = (payload) =>
  publicApi.post('usuario/reset_password/', payload);

export const verificarCodigoUsuario = (payload) =>
  publicApi.post("usuario/verificar_codigo/", payload);


/* ---------------------- ENDPOINTS PROTEGIDOS ---------------------- */

export const fetchUsuario = () => api.get('usuario/me/');

export const updateUsuario = (id, payload) =>
  api.put(`usuario/${id}/`, payload);

export const handleToggleEstado = (id, estadoActual) =>
  api.patch(`usuario/${id}/`, { estado: !estadoActual });

export const getUsuarios = () => api.get('usuario/');

export const updateUsuarioPartial = (id, data) =>
  api.patch(`usuario/${id}/`, data); // <-- PATCH real
