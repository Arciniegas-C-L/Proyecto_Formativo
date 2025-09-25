// src/auth/authService.js
const ACCESS = "access_token";
const REFRESH = "refresh_token";
const USER = "usuario";
const ROL = "rol";

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

export const auth = {
  guardarSesion({ access, refresh, usuario, rol }) {
    if (access)  localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
    if (usuario) localStorage.setItem(USER, JSON.stringify(usuario));
    if (rol)     localStorage.setItem(ROL, rol);
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

  obtenerRol() {
    const rol = localStorage.getItem(ROL);
    return rol && rol.trim() !== "" ? rol : null;
  },

  obtenerSesion() {
    const access  = auth.obtenerToken();
    const refresh = auth.obtenerRefreshToken();
    const usuario = safeParse(localStorage.getItem(USER));
    const rol     = auth.obtenerRol();
    return { access, refresh, usuario, rol, autenticado: !!access };
  },

  tienePermiso(rolesPermitidos) {
    const rolActual = auth.obtenerRol();
    if (!rolActual) return false;
    if (Array.isArray(rolesPermitidos)) return rolesPermitidos.includes(rolActual);
    return rolActual === rolesPermitidos;
  },
};
