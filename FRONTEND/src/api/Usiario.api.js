import axios from "axios";

const UsuarioApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/usuario/",
});

export const registerUsuario = (usuario) => {
    return UsuarioApi.post("registro/", usuario);
};

export const loginUsuario = (credenciales) => {
    return UsuarioApi.post("login/", credenciales);
};

export const solicitarRecuperacion = (data) => {
    return UsuarioApi.post('recuperar_contrasena/', data);
};

// Agrega esta función para cambiar la contraseña con código verificado
export const resetearContrasena = (data) => {
    // data debe tener: correo, codigo, contrasena (nueva contraseña)
    return UsuarioApi.post('reset_password/', data);
};