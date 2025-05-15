import axios from "axios";

const UsuarioApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/usuario/",
});

export const registerUsuario = (usuario) => UsuarioApi.post("/", usuario);

export const loginUsuario = (credenciales) => axios.post("http://127.0.0.1:8000/BACKEND/api/usuario/login/", credenciales);
