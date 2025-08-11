// Importa la librería Axios para realizar peticiones HTTP
import axios from "axios";

// ---------------------- API PARA ROLES ----------------------

// Crea una instancia de Axios específica para el endpoint de roles
const RolApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/rol/"  // Ruta base para los recursos de roles
});


// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

// Función para obtener todos los roles
// Hace una petición GET a la ruta base
export const getALLRoles = () => RolApi.get("/");

// Función para crear un nuevo rol
// Recibe un objeto `Rol` con los datos que se van a enviar al backend
export const createRol = (Rol) => RolApi.post("/", Rol);

// Función para eliminar un rol específico por su ID
// Hace una petición DELETE al endpoint con el ID correspondiente
export const deleteRol = (id) => RolApi.delete(`/${id}`);

// Función para actualizar un rol existente por su ID
// Recibe el `id` del rol a actualizar y el objeto `Rol` con los nuevos datos
export const updateRol = (id, Rol) => RolApi.put(`/${id}`, Rol);

