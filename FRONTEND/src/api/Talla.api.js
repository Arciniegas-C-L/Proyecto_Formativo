// Importamos Axios, la librería para hacer peticiones HTTP
import axios from 'axios';

// Definimos la URL base del backend para reutilizarla
const BASE_URL = 'http://127.0.0.1:8000/BACKEND/api';

// Creamos una instancia personalizada de Axios para las peticiones relacionadas con "talla"
const TallaApi = axios.create({
    baseURL: `${BASE_URL}/talla/`, // Ruta base para el endpoint de tallas
    headers: {
        'Content-Type': 'application/json', // Indicamos que los datos enviados estarán en formato JSON
        'Accept': 'application/json'        // Indicamos que aceptamos respuestas en formato JSON
    }
});


// src/api/Usuario.api.js
import { api } from './client';

export const getUsuarios = () => api.get('usuarios/');
export const updateUsuario = (id, payload) => api.put(`usuarios/${id}/`, payload);

// =================== FUNCIONES PARA LA API DE TALLA ===================

// Obtener todas las tallas
export const getAllTallas = () => TallaApi.get('');

// Obtener una talla específica por su ID
export const getTallaById = (id) => TallaApi.get(`${id}/`);

// Crear una nueva talla
// El parámetro "data" debe contener los datos de la nueva talla en formato objeto
export const createTalla = (data) => TallaApi.post('', data);

// Actualizar una talla existente por su ID
// Se debe pasar el ID de la talla y el nuevo objeto con los datos actualizados
export const updateTalla = (id, data) => TallaApi.put(`${id}/`, data);

// Eliminar una talla por su ID
export const deleteTalla = (id) => TallaApi.delete(`${id}/`);

// Cambiar el estado (activo/inactivo) de una talla
// Se usa el método PATCH porque solo se actualiza parcialmente (solo el campo "estado")
//PATCH es uno de los métodos HTTP utilizados para actualizar parcialmente un recurso en un servidor.
//A diferencia del método PUT, 
//que reemplaza completamente un recurso, PATCH modifica solo los campos especificados.
export const cambiarEstadoTalla = (id, estado) => TallaApi.patch(`${id}/cambiar_estado/`, { estado });

// Obtener todas las tallas que pertenecen a un grupo específico (filtrado por ID del grupo)
export const getTallasByGrupo = (grupoId) => TallaApi.get(`/?grupo=${grupoId}`);

// Obtener solo las tallas que están activas (estado=true)
export const getTallasActivas = () => TallaApi.get("/?estado=true");
