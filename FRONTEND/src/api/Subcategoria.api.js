// src/api/Subcategoria.api.js
import { api } from './roles';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* ---------------------- SUBCATEGORÍAS ---------------------- */

// Obtener todas las subcategorías
export const getAllSubcategorias = async () => {
  try {
    const res = await api.get('subcategoria/');
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

// Obtener subcategorías filtradas por categoría
export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await api.get('subcategoria/por_categoria/', {
      params: { categoria: categoriaId },
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
    const res = await api.post('subcategoria/', subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al crear subcategoría:", error);
    throw error;
  }
};

// Actualizar una subcategoría existente
export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await api.put(`subcategoria/${id}/`, subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error);
    throw error;
  }
};

// Eliminar una subcategoría por ID
export const deleteSubcategoria = async (id) => {
  try {
    await api.delete(`subcategoria/${id}/`);
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error);
    throw error;
  }
};

// Actualizar el grupo de talla asignado a una subcategoría
export const updateGrupoTalla = async (subcategoriaId, grupoTallaId) => {
  if (!subcategoriaId || !grupoTallaId) {
    throw new Error('Se requieren tanto el ID de la subcategoría como el ID del grupo de talla');
  }

  const grupoTallaIdNum = Number(grupoTallaId);
  if (isNaN(grupoTallaIdNum)) {
    throw new Error('El ID del grupo de talla debe ser un número válido');
  }

  try {
    const response = await api.put(`subcategoria/${subcategoriaId}/actualizar_grupo_talla/`, {
      grupoTalla: grupoTallaIdNum,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

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
    const response = await api.post('subcategoria/asignar_grupo_talla_default/');
    return response.data;
  } catch (error) {
    console.error('Error al asignar grupo de tallas por defecto:', error.response?.data || error.message);
    throw error;
  }
};
