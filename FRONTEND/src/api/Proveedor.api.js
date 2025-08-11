// Importa la librería Axios para hacer peticiones HTTP
import axios from "axios";
import API from "./axios";

// ---------------------- API PARA PROVEEDORES ----------------------

// Se crea una instancia de Axios para las peticiones relacionadas con proveedores
const ProveedorApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/proveedores/"  // URL base del endpoint de proveedores
});

// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);


// Función para obtener todos los proveedores
export const fetchProveedores = () => API.get("/proveedores/");

// Función para crear un nuevo proveedor
// Recibe como parámetro un objeto `Proveedor` con los datos a guardar
export const createProveedor = (Proveedor) => API.post("/proveedores/", Proveedor);

// Función para actualizar un proveedor existente
// Recibe el `id` del proveedor y el objeto actualizado
export const updateProveedor = (id, Proveedor) => API.put(`/proveedores/${id}/`, Proveedor);

// Función para eliminar un proveedor por su ID
export const deleteProveedor = (id) => API.delete(`/proveedores/${id}/`);


// ---------------------- API PARA USUARIOS ----------------------

// Función para obtener todos los usuarios
// No se usa una instancia personalizada aquí, sino que se hace la petición directamente con Axios
export const fetchUsuarios = () => API.get("/usuario/");
