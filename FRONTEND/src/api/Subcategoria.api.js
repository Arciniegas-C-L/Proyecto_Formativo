import axios from "axios";

const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

const SubcategoriaApi = axios.create({
  baseURL: `${BASE_URL}/subcategoria/`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const getAllSubcategorias = async () => {
  try {
    const res = await SubcategoriaApi.get("/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await SubcategoriaApi.get("/por_categoria/", {
      params: { categoria: categoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías por categoría:", error);
    throw error;
  }
};

export const createSubcategoria = async (subcategoria) => {
  try {
    const res = await SubcategoriaApi.post("/", subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al crear subcategoría:", error);
    throw error;
  }
};

export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await SubcategoriaApi.put(`${id}/`, subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error);
    throw error;
  }
};

export const deleteSubcategoria = async (id) => {
  try {
    await SubcategoriaApi.delete(`${id}/`);
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error);
    throw error;
  }
};

export const updateGrupoTalla = async (subcategoriaId, grupoTallaId) => {
  if (!subcategoriaId || !grupoTallaId) {
    throw new Error('Se requieren tanto el ID de la subcategoría como el ID del grupo de talla');
  }

  try {
    // Asegurarse de que grupoTallaId sea un número
    const grupoTallaIdNum = Number(grupoTallaId);
    if (isNaN(grupoTallaIdNum)) {
      throw new Error('El ID del grupo de talla debe ser un número válido');
    }

    const response = await SubcategoriaApi.put(
      `${subcategoriaId}/actualizar_grupo_talla/`,
      { grupoTalla: grupoTallaIdNum }
    );
    
    return response.data;
  } catch (error) {
    // Manejar errores específicos del backend
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    // Manejar errores HTTP específicos
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

export const asignarGrupoTallaDefault = async () => {
  try {
    const response = await SubcategoriaApi.post('asignar_grupo_talla_default/');
    console.log('Respuesta de asignación de grupo por defecto:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al asignar grupo de tallas por defecto:', error.response?.data || error.message);
    throw error;
  }
};
