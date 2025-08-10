// src/auth/authService.js

// Guardar datos de sesión
export const guardarSesion = (token, usuario) => {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
};

// Obtener token
export const obtenerToken = () => {
    return localStorage.getItem("token");
};

// Obtener usuario
export const obtenerUsuario = () => {
    const usuario = localStorage.getItem("usuario");
    return usuario ? JSON.parse(usuario) : null;
};

// Cerrar sesión
export const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
};
