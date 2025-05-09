import axios from "axios";

const UsuarioApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/usuario/"
})

export const getALLUsuarios = () => UsuarioApi.get("/");
export const createUsuario = (Usuario) => UsuarioApi.post("/", Usuario);