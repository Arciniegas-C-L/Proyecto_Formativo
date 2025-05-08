import axios from "axios";

const RolApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/rol/"
})

export const getALLRoles = () => RolApi.get("/");
export const createRol = (Rol) => RolApi.post("/", Rol);
