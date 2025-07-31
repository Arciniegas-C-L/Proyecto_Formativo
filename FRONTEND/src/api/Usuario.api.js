// Importamos la librería axios para realizar peticiones HTTP
import axios from "axios";

// Creamos una instancia personalizada de axios con una URL base
const UsuarioApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/usuario/", // URL base para todas las peticiones relacionadas con usuarios
});

// ------------------------- AUTENTICACIÓN -------------------------

// Registro de nuevo usuario
// Envia los datos del usuario a la ruta /registro/
export const registerUsuario = (usuario) => {
    return UsuarioApi.post("registro/", usuario);
};

// Inicio de sesión de usuario
// Envia las credenciales a la ruta /login/
export const loginUsuario = (credenciales) => {
    return UsuarioApi.post("login/", credenciales);
};

// Solicitar recuperación de contraseña
// Envia el correo o identificador del usuario a /recuperar_contrasena/
export const solicitarRecuperacion = (data) => {
    return UsuarioApi.post("recuperar_contrasena/", data);
};

// Resetear la contraseña con token recibido (por ejemplo, desde un correo)
// Envia la nueva contraseña y token a /reset_password/
export const resetearContrasena = (data) => {
    return UsuarioApi.post("reset_password/", data);
};

// ------------------------- GESTIÓN DE USUARIOS -------------------------

// Obtener todos los usuarios
export const fetchUsuario = () => UsuarioApi.get("");

// Actualizar datos de un usuario por su ID
export const updateUsuario = async (id, Usuario) => UsuarioApi.put(`/${id}/`, Usuario);

// Cambiar el estado (activo/inactivo) del usuario
export const handleToggleEstado = (id, Usuario) => UsuarioApi.put(`/${id}/`, Usuario);
