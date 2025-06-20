import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

const TallaApi = axios.create({
  baseURL: `${BASE_URL}/talla/`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const getTallasPaginadas = (page = 1) => {
  return TallaApi.get(`?page=${page}`);
};

// 🔹 Función para procesar paginación
const procesarRespuesta = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data.results;
};

// ✅ Obtener todas las tallas (paginar si es necesario)
export const getAllTallas = async () => {
  try {
    const response = await TallaApi.get('');
    return procesarRespuesta(response);
  } catch (error) {
    console.error("Error al obtener todas las tallas:", error);
    throw error;
  }
};

// ✅ Obtener talla por ID
export const getTallaById = async (id) => {
  try {
    const response = await TallaApi.get(`${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener talla con ID ${id}:`, error);
    throw error;
  }
};

// ✅ Crear nueva talla
export const createTalla = async (data) => {
  try {
    const response = await TallaApi.post('', data);
    return response.data;
  } catch (error) {
    console.error("Error al crear talla:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Actualizar talla
export const updateTalla = async (id, data) => {
  try {
    const response = await TallaApi.put(`${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar talla con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// ✅ Eliminar talla
export const deleteTalla = async (id) => {
  try {
    await TallaApi.delete(`${id}/`);
  } catch (error) {
    console.error(`Error al eliminar talla con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// ✅ Cambiar estado (activo/inactivo) de una talla
export const cambiarEstadoTalla = async (id, estado) => {
  try {
    const response = await TallaApi.patch(`${id}/cambiar_estado/`, { estado });
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar estado de la talla con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// ✅ Obtener tallas por grupo
export const getTallasByGrupo = async (grupoId) => {
  try {
    const response = await TallaApi.get(`/?grupo=${grupoId}`);
    return procesarRespuesta(response);
  } catch (error) {
    console.error(`Error al obtener tallas por grupo con ID ${grupoId}:`, error.response?.data || error.message);
    throw error;
  }
};

// ✅ Obtener solo tallas activas
export const getTallasActivas = async () => {
  try {
    const response = await TallaApi.get('/?estado=true');
    return procesarRespuesta(response);
  } catch (error) {
    console.error("Error al obtener tallas activas:", error.response?.data || error.message);
    throw error;
  }
};
