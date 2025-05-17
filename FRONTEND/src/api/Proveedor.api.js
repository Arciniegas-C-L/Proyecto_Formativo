import axios from "axios";

const ProveedorApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/proveedores/"
});

export const fetchProveedores = () => ProveedorApi.get("");

export const createProveedor = (Proveedor) => ProveedorApi.post("/", Proveedor);

export const updateProveedor = (id, Proveedor) => ProveedorApi.put(`/${id}/`, Proveedor);

export const deleteProveedor = (id) => ProveedorApi.delete(`/${id}/`);

// Nueva API para usuarios: ajusta esta URL si es necesario
export const fetchUsuarios = () => axios.get("http://127.0.0.1:8000/BACKEND/api/usuario/");

