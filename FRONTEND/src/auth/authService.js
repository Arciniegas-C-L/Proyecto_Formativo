// src/auth/authService.js
const ACCESS = 'access_token';
const REFRESH = 'refresh_token';
const USER = 'usuario';
const ROL = 'rol';

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export const auth = {
  guardarSesion({ access, refresh, usuario, rol }) {
    if (access) localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
    if (usuario) localStorage.setItem(USER, JSON.stringify(usuario));
    if (rol) localStorage.setItem(ROL, rol);
  },

  limpiarSesion() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
    localStorage.removeItem(ROL);
  },

  obtenerToken() {
    return localStorage.getItem(ACCESS);
  },

  obtenerRefreshToken() {
    return localStorage.getItem(REFRESH);
  },

  obtenerSesion() {
    const token = auth.obtenerToken();
    const usuario = safeParse(localStorage.getItem(USER));
    const rol = localStorage.getItem(ROL);
    return { token, usuario, rol, autenticado: !!token };
  }
};
