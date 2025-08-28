import { api } from './roles';

// Función para obtener todas las categorías
export const getAllCategorias = async () => {
  try {
    const res = await api.get('categoria/');
    return res.data;
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};

// Función para crear una nueva categoría
export const createCategoria = async (categoria) => {
  try {
    const res = await api.post('categoria/', categoria);
    return res.data;
  } catch (error) {
    console.error("Error al crear categoría:", error);
    throw error;
  }
};

// Función para actualizar una categoría existente
export const updateCategoria = async (id, categoria) => {
  try {
    const res = await api.put(`categoria/${id}/`, categoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    throw error;
  }
};

// Función para eliminar una categoría por su ID
export const deleteCategoria = async (id) => {
  try {
    await api.delete(`categoria/${id}/`);
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    throw error;
  }
};

// Extra: usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
