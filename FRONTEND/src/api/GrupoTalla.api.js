import { api } from './roles';

// Usuarios (si aplica en este módulo)
export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

/* ---------------- FUNCIONES CRUD PARA GRUPO TALLA ---------------- */

// Obtener todos los grupos de talla
export const getAllGruposTalla = async () => {
  try {
    const response = await api.get('grupo-talla/');
    const gruposTalla = response.data.map(grupo => ({
      ...grupo,
      Tallas: grupo.tallas || [],
    }));
    return { ...response, data: gruposTalla };
  } catch (error) {
    console.error('Error al obtener grupos de talla:', error);
    throw error;
  }
};

// Obtener un grupo de talla por su ID
export const getGrupoTallaById = async (id) => {
  try {
    const response = await api.get(`grupo-talla/${id}/`);
    return {
      ...response,
      data: {
        ...response.data,
        Tallas: response.data.tallas || [],
      },
    };
  } catch (error) {
    console.error('Error al obtener grupo de talla:', error);
    throw error;
  }
};

// Crear un nuevo grupo de talla
export const createGrupoTalla = (data) => api.post('grupo-talla/', data);

// Actualizar un grupo de talla existente
export const updateGrupoTalla = (id, data) => api.put(`grupo-talla/${id}/`, data);

// Eliminar un grupo de talla por su ID
export const deleteGrupoTalla = (id) => api.delete(`grupo-talla/${id}/`);

// Cambiar el estado (activo/inactivo) de un grupo de talla
export const cambiarEstadoGrupoTalla = (id, estado) =>
  api.patch(`grupo-talla/${id}/cambiar_estado/`, { estado });

/* ------- FUNCIONES ADICIONALES PARA MANEJAR TALLAS EN CADA GRUPO ------- */

// Obtener solo las tallas activas asociadas a un grupo
export const getTallasActivasByGrupo = async (id) => {
  try {
    const response = await api.get(`grupo-talla/${id}/tallas_activas/`);
    return response;
  } catch (error) {
    console.error('Error al obtener tallas activas del grupo:', error);
    throw error;
  }
};

// Agregar una talla a un grupo de tallas específico
export const agregarTallaToGrupo = async (id, talla) => {
  try {
    const response = await api.post(`grupo-talla/${id}/agregar_talla/`, talla);
    return response;
  } catch (error) {
    console.error('Error al agregar talla al grupo:', error);
    throw error;
  }
};
