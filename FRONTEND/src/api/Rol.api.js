import axios from "axios";

const RolApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/rol/"
})

export const getALLRoles = () => RolApi.get("/");
export const createRol = (Rol) => RolApi.post("/", Rol);
export const deleteRol = (id) => RolApi.delete(`/${id}`);
export const updateRol = (id, Rol) => RolApi.put(`/${id}`, Rol);

const UsuarioApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/usuario/"
})

export const getALLUsuarios = () => UsuarioApi.get("/");
export const createUsuario = (Usuario) => UsuarioApi.post("/", Usuario);

const ProductoApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/producto/"
})

export const getALLProductos = () => ProductoApi.get("/");
export const createProducto = (Producto) => ProductoApi.post("/", Producto);