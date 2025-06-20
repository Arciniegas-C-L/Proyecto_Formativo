import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

// Instancia de Axios
const GrupoTallaApi = axios.create({
  baseURL: `${BASE_URL}/grupo-talla/`, // Confirma que esta URL coincide con la de tus rutas DRF
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ✅ Obtener grupos de talla con paginación
export const getGruposTallaPaginados = async (page = 1, pageSize = 10) => {
  try {
    const response = await GrupoTallaApi.get('', {
      params: {
        page,
        page_size: pageSize,
      },
    });

    const data = response.data;

    // Validación robusta de estructura esperada
    const resultados = Array.isArray(data.results) ? data.results : [];

    // Aseguramos que cada grupo tenga la propiedad 'Tallas'
    const gruposConTallas = resultados.map(grupo => ({
      ...grupo,
      Tallas: grupo.tallas || []
    }));

    return {
      resultados: gruposConTallas,
      count: data.count || 0,
      next: data.next || null,
      previous: data.previous || null,
    };
  } catch (error) {
    console.error('❌ Error al obtener grupos de talla paginados:', error);
    throw error;
  }
};

// ✅ Crear un grupo de talla
export const createGrupoTalla = async (data) => {
  try {
    const response = await GrupoTallaApi.post('', data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear grupo de talla:', error);
    throw error;
  }
};

// ✅ Actualizar un grupo de talla
export const updateGrupoTalla = async (id, data) => {
  try {
    const response = await GrupoTallaApi.put(`${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar grupo de talla:', error);
    throw error;
  }
};

// ✅ Eliminar un grupo de talla
export const deleteGrupoTalla = async (id) => {
  try {
    const response = await GrupoTallaApi.delete(`${id}/`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar grupo de talla:', error);
    throw error;
  }
};
