// Importamos Axios para hacer peticiones HTTP
import axios from "axios";

// Definimos la URL base del backend
const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

// Creamos una instancia personalizada de Axios para las subcategorías
const SubcategoriaApi = axios.create({
  baseURL: `${BASE_URL}/subcategoria/`, // Ruta específica para subcategorías
  headers: {
    'Content-Type': 'application/json', // Tipo de contenido que enviamos
    'Accept': 'application/json' // Tipo de contenido que esperamos recibir
  }
});

// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);


// Obtener todas las subcategorías
export const getAllSubcategorias = async () => {
  try {
    const res = await SubcategoriaApi.get("/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

// Obtener subcategorías filtradas por categoría
export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await SubcategoriaApi.get("/por_categoria/", {
      params: { categoria: categoriaId }, // Enviamos el ID por parámetros
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías por categoría:", error);
    throw error;
  }
};

// Crear una nueva subcategoría
export const createSubcategoria = async (subcategoria) => {
  try {
    const res = await SubcategoriaApi.post("/", subcategoria); // Enviamos el objeto subcategoría
    return res.data;
  } catch (error) {
    console.error("Error al crear subcategoría:", error);
    throw error;
  }
};

// Actualizar una subcategoría existente
export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await SubcategoriaApi.put(`${id}/`, subcategoria); // Usamos el ID en la URL
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error);
    throw error;
  }
};

// Eliminar una subcategoría por ID
export const deleteSubcategoria = async (id) => {
  try {
    await SubcategoriaApi.delete(`${id}/`);
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error);
    throw error;
  }
};

// Actualizar el grupo de talla asignado a una subcategoría
export const updateGrupoTalla = async (subcategoriaId, grupoTallaId) => {
  // Validamos que ambos IDs estén presentes
  if (!subcategoriaId || !grupoTallaId) {
    throw new Error('Se requieren tanto el ID de la subcategoría como el ID del grupo de talla');
  }

  try {
    // Aseguramos que grupoTallaId sea un número válido
    const grupoTallaIdNum = Number(grupoTallaId);
    if (isNaN(grupoTallaIdNum)) {
      throw new Error('El ID del grupo de talla debe ser un número válido');
    }

    // Realizamos la petición al endpoint personalizado
    const response = await SubcategoriaApi.put(
      `${subcategoriaId}/actualizar_grupo_talla/`,
      { grupoTalla: grupoTallaIdNum }
    );
    
    return response.data;
  } catch (error) {
    // Capturamos errores específicos del backend
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    // Manejamos los distintos códigos de error HTTP
    switch (error.response?.status) {
      case 400:
        if (error.response.data?.error?.includes('ya tiene asignado')) {
          throw new Error('La subcategoría ya tiene asignado este grupo de talla');
        }
        throw new Error(error.response.data?.error || 'Datos inválidos para la actualización');
      case 404:
        throw new Error('No se encontró la subcategoría o el grupo de talla');
      case 500:
        throw new Error('Error interno del servidor al actualizar el grupo de talla');
      default:
        throw new Error('Error al actualizar el grupo de talla: ' + (error.message || 'Error desconocido'));
    }
  }
};

// Asignar automáticamente un grupo de talla por defecto a todas las subcategorías que no lo tengan
export const asignarGrupoTallaDefault = async () => {
  try {
    const response = await SubcategoriaApi.post('asignar_grupo_talla_default/');
    return response.data;
  } catch (error) {
    console.error('Error al asignar grupo de tallas por defecto:', error.response?.data || error.message);
    throw error;
  }
};
