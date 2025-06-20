import axios from "axios";

const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

const SubcategoriaApi = axios.create({
  baseURL: `${BASE_URL}/subcategoria/`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ Obtener todas las subcategorías (res.data.results si paginación)
export const getAllSubcategorias = async () => {
  try {
    const res = await SubcategoriaApi.get('/');
    return Array.isArray(res.data) ? res.data : res.data.results;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

// ✅ Subcategorías por categoría
export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await SubcategoriaApi.get('por_categoria/', {
      params: { categoria: categoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías por categoría:", error);
    throw error;
  }
};

// ✅ Crear nueva subcategoría
export const createSubcategoria = async (data) => {
  try {
    console.log("🟡 Enviando datos:", data);
    const response = await SubcategoriaApi.post('/', data); // 🔧 CORREGIDO aquí
    return response.data;
  } catch (error) {
    console.error("🔴 Error al crear subcategoría:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Actualizar subcategoría
export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await SubcategoriaApi.put(`${id}/`, subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error);
    throw error;
  }
};

// ✅ Eliminar subcategoría
export const deleteSubcategoria = async (id) => {
  try {
    await SubcategoriaApi.delete(`${id}/`);
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error);
    throw error;
  }
};

// ✅ Actualizar grupo de talla en una subcategoría
export const updateGrupoTalla = async (subcategoriaId, grupoTallaId) => {
  if (!subcategoriaId || !grupoTallaId) {
    throw new Error('Se requieren tanto el ID de la subcategoría como el ID del grupo de talla');
  }

  try {
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
    const mensaje = error.response?.data?.error || error.message || 'Error desconocido';
    throw new Error(`Error al actualizar el grupo de talla: ${mensaje}`);
  }
};

// ✅ Asignar grupo de talla por defecto
export const asignarGrupoTallaDefault = async () => {
  try {
    const response = await SubcategoriaApi.post('asignar_grupo_talla_default/', {});
    return response.data;
  } catch (error) {
    console.error('Error al asignar grupo de tallas por defecto:', error.response?.data || error.message);
    throw error;
  }
};
