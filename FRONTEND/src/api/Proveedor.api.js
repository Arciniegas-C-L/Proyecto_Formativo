// Importa la librería Axios para hacer peticiones HTTP
import axios from "axios";

// ---------------------- API PARA PROVEEDORES ----------------------

// Se crea una instancia de Axios para las peticiones relacionadas con proveedores
const ProveedorApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/proveedores/"  // URL base del endpoint de proveedores
});

// Función para obtener todos los proveedores
export const fetchProveedores = () => ProveedorApi.get("");

// Función para crear un nuevo proveedor
// Recibe como parámetro un objeto `Proveedor` con los datos a guardar
export const createProveedor = (Proveedor) => ProveedorApi.post("", Proveedor);

// Función para actualizar un proveedor existente
// Recibe el `id` del proveedor y el objeto actualizado
export const updateProveedor = (id, Proveedor) => ProveedorApi.put(`/${id}/`, Proveedor);

// Función para eliminar un proveedor por su ID
export const deleteProveedor = (id) => ProveedorApi.delete(`/${id}/`);


// ---------------------- API PARA USUARIOS ----------------------

// Función para obtener todos los usuarios
// No se usa una instancia personalizada aquí, sino que se hace la petición directamente con Axios
export const fetchUsuarios = () => axios.get("http://127.0.0.1:8000/BACKEND/api/usuario/");
