import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

const TallaApi = axios.create({
    baseURL: `${BASE_URL}/talla/`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Funciones para Talla
export const getAllTallas = () => TallaApi.get('');
export const getTallaById = (id) => TallaApi.get(`${id}/`);
export const createTalla = (data) => TallaApi.post('', data);
export const updateTalla = (id, data) => TallaApi.put(`${id}/`, data);
export const deleteTalla = (id) => TallaApi.delete(`${id}/`);
export const cambiarEstadoTalla = (id, estado) => TallaApi.patch(`${id}/cambiar_estado/`, { estado });
export const getTallasByGrupo = (grupoId) => TallaApi.get(`/?grupo=${grupoId}`);
export const getTallasActivas = () => TallaApi.get("/?estado=true");