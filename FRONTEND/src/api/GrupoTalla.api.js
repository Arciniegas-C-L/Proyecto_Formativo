import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

// Instancia de axios para GrupoTalla
const GrupoTallaApi = axios.create({
    baseURL: `${BASE_URL}/grupo-talla/`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Funciones para GrupoTalla
export const getAllGruposTalla = async () => {
    try {
        const response = await GrupoTallaApi.get('');
        // Asegurarse de que la respuesta incluya las tallas asociadas
        const gruposTalla = response.data.map(grupo => ({
            ...grupo,
            Tallas: grupo.tallas || [] // Renombramos 'tallas' a 'Tallas' para mantener consistencia con el frontend
        }));
        return { ...response, data: gruposTalla };
    } catch (error) {
        console.error('Error al obtener grupos de talla:', error);
        throw error;
    }
};

export const getGrupoTallaById = async (id) => {
    try {
        const response = await GrupoTallaApi.get(`${id}/`);
        return {
            ...response,
            data: {
                ...response.data,
                Tallas: response.data.tallas || []
            }
        };
    } catch (error) {
        console.error('Error al obtener grupo de talla:', error);
        throw error;
    }
};

export const createGrupoTalla = (data) => GrupoTallaApi.post('', data);
export const updateGrupoTalla = (id, data) => GrupoTallaApi.put(`${id}/`, data);
export const deleteGrupoTalla = (id) => GrupoTallaApi.delete(`${id}/`);
export const cambiarEstadoGrupoTalla = (id, estado) => GrupoTallaApi.patch(`${id}/cambiar_estado/`, { estado });

// Funciones específicas para tallas dentro de un grupo
export const getTallasActivasByGrupo = async (id) => {
    try {
        const response = await GrupoTallaApi.get(`${id}/tallas_activas/`);
        return response;
    } catch (error) {
        console.error('Error al obtener tallas activas del grupo:', error);
        throw error;
    }
};

export const agregarTallaToGrupo = async (id, talla) => {
    try {
        const response = await GrupoTallaApi.post(`${id}/agregar_talla/`, talla);
        return response;
    } catch (error) {
        console.error('Error al agregar talla al grupo:', error);
        throw error;
    }
}; 