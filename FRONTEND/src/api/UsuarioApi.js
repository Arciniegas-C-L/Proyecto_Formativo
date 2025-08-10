import axios from "axios";
import { obtenerToken } from "../auth/authService";

const UsuarioApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/usuario/",
});

// Interceptor para agregar token en el header
UsuarioApi.interceptors.request.use((config) => {
    const token = obtenerToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default UsuarioApi;
