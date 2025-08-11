// Importamos la librería Axios, que se utiliza para hacer peticiones HTTP
import axios from "axios";

// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');


// Creamos una instancia personalizada de Axios con una URL base específica.
// Todas las peticiones hechas con esta instancia usarán esta baseURL como prefijo.
const CategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/categoria/", // Endpoint base para trabajar con categorías
});

// Función para obtener todas las categorías desde la API
export const getAllCategorias = async () => {
  try {
    // Hacemos una solicitud GET al endpoint raíz (equivalente a baseURL)
    const res = await CategoriaApi.get("/");
    return res.data; // Retornamos los datos obtenidos
  } catch (error) {
    // Si hay error, lo mostramos en consola y lo lanzamos para manejarlo desde el componente que lo llame
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};

// Función para crear una nueva categoría
export const createCategoria = async (categoria) => {
  try {
    // Hacemos una solicitud POST con el objeto `categoria` como cuerpo
    const res = await CategoriaApi.post("/", categoria);
    return res.data; // Retornamos la categoría creada (respuesta del backend)
  } catch (error) {
    console.error("Error al crear categoría:", error);
    throw error;
  }
};

// Función para actualizar una categoría existente
export const updateCategoria = async (id, categoria) => {
  try {
    // Hacemos una solicitud PUT al endpoint con el ID específico de la categoría
    // Enviamos los nuevos datos en el cuerpo de la petición
    const res = await CategoriaApi.put(`${id}/`, categoria);
    return res.data; // Retornamos la categoría actualizada
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    throw error;
  }
};

// Función para eliminar una categoría por su ID
export const deleteCategoria = async (id) => {
  try {
    // Hacemos una solicitud DELETE al endpoint con el ID de la categoría
    await CategoriaApi.delete(`${id}/`);
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    throw error;
  }
};
