import { api } from './client';
import { publicApi } from './publicClient'; // ✅ nuevo import

// Endpoints públicos (sin token)
export const registerUsuario = (usuario) => publicApi.post('usuario/register/', usuario);
export const loginUsuario = (credenciales) => publicApi.post('usuario/login/', credenciales);
export const solicitarRecuperacion = (payload) => publicApi.post('usuario/recuperar_contrasena/', payload);
export const resetearContrasena = (payload) => publicApi.post('usuario/reset_password/', payload);

// Endpoints protegidos (requieren token)
export const fetchUsuario = () => api.get('usuario/');
export const updateUsuario = (id, payload) => api.put(`usuario/${id}/`, payload);
export const handleToggleEstado = (id, estadoActual) => api.patch(`usuario/${id}/`, { estado: !estadoActual });
export const getUsuarios = () => api.get('usuario/');
