const TOKEN_KEY = 'token';
const USER_ROLE = 'rol';

export const guardarSesion = (token, rol) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ROLE, rol);
};

export const obtenerToken = () => localStorage.getItem(TOKEN_KEY);
export const obtenerRol = () => localStorage.getItem(USER_ROLE);

export const isAuthenticated = () => !!obtenerToken();

export const isAdmin = () => obtenerRol() === 'administrador';
export const isCliente = () => obtenerRol() === 'cliente';

export const cerrarSesion = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ROLE);
};
