import axios from "axios";

const ProveedorApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/proveedor/"
})

export const getALLProveedores = () => ProveedorApi.get("/");
export const createProveedor = (Proveedor) => ProveedorApi.post("/", Proveedor);