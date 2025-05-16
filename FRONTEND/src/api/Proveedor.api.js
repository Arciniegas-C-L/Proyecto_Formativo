import axios from "axios";

const ProveedorApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/proveedores"
});

//  Obtener todos los proveedores
export const fetchProveedores = () => ProveedorApi.get("/");

//  Crear proveedor
export const createProveedor = async (Proveedor) => {
    try {
    const response = await ProveedorApi.post("", Proveedor);
    return response.data;
} catch (error) {
    console.error("Error al registrar proveedor:", error.response?.data || error.message);
}
};

// Actualizar proveedor
export const updateProveedor = async (id, Proveedor) => {
    try {
    const response = await ProveedorApi.put(`${id}/`, Proveedor);
    return response.data;
} catch (error) {
    console.error("Error al actualizar proveedor:", error.response?.data || error.message);
}
};

//  Eliminar proveedor
export const deleteProveedor = async (id) => {
try {
    await ProveedorApi.delete(`${id}/`);
} catch (error) {
    console.error("Error al eliminar proveedor:", error.response?.data || error.message);
}
};
