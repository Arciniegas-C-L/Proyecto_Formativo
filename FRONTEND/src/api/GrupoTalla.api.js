// Importamos Axios para hacer peticiones HTTP
import axios from 'axios';

// Definimos la URL base de la API
const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

// Creamos una instancia de Axios específica para trabajar con "GrupoTalla"
const GrupoTallaApi = axios.create({
    baseURL: `${BASE_URL}/grupo-talla/`, // Se configura para apuntar al endpoint de grupo-talla
    headers: {
        'Content-Type': 'application/json', // Tipo de contenido que se enviará
        'Accept': 'application/json'        // Tipo de contenido que se espera recibir
    }
});

/* ---------------- FUNCIONES CRUD PARA GRUPO TALLA ---------------- */

// Obtener todos los grupos de talla
export const getAllGruposTalla = async () => {
    try {
        const response = await GrupoTallaApi.get('');
        // Se mapean los grupos para asegurar que todos tengan la propiedad "Tallas"
        const gruposTalla = response.data.map(grupo => ({
            ...grupo,
            Tallas: grupo.tallas || [] // Se renombra a "Tallas" para mantener consistencia en el frontend
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

// Crear un nuevo grupo de talla
export const createGrupoTalla = (data) => GrupoTallaApi.post('', data);

// Actualizar un grupo de talla existente
export const updateGrupoTalla = (id, data) => GrupoTallaApi.put(`${id}/`, data);

// Eliminar un grupo de talla por su ID
export const deleteGrupoTalla = (id) => GrupoTallaApi.delete(`${id}/`);

// Cambiar el estado (activo/inactivo) de un grupo de talla
export const cambiarEstadoGrupoTalla = (id, estado) =>
    GrupoTallaApi.patch(`${id}/cambiar_estado/`, { estado });

/* ------- FUNCIONES ADICIONALES PARA MANEJAR TALLAS EN CADA GRUPO ------- */

// Obtener solo las tallas activas asociadas a un grupo
export const getTallasActivasByGrupo = async (id) => {
    try {
        const response = await GrupoTallaApi.get(`${id}/tallas_activas/`);
        return response;
    } catch (error) {
        console.error('Error al obtener tallas activas del grupo:', error);
        throw error;
    }
};

// Agregar una talla a un grupo de tallas específico
export const agregarTallaToGrupo = async (id, talla) => {
    try {
        const response = await GrupoTallaApi.post(`${id}/agregar_talla/`, talla);
        return response;
    } catch (error) {
        console.error('Error al agregar talla al grupo:', error);
        throw error;
    }
};
