// src/auth/authService.js
const ACCESS = "access_token";
const REFRESH = "refresh_token";
const USER = "usuario";
const ROL = "rol";
const GUEST = "guest"; // <-- nuevo

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

export const auth = {
  guardarSesion({ access, refresh, usuario, rol, guest = false }) {
    if (access)  localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
    if (usuario) localStorage.setItem(USER, JSON.stringify(usuario));
    if (rol)     localStorage.setItem(ROL, rol);
    localStorage.setItem(GUEST, JSON.stringify(!!guest)); // true/false
  },

  limpiarSesion() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
    localStorage.removeItem(ROL);
    localStorage.removeItem(GUEST);
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

  esInvitado() {
    const raw = localStorage.getItem(GUEST);
    const guest = raw ? JSON.parse(raw) : false;
    const rol = (localStorage.getItem(ROL) || "").toLowerCase();
    // si no guardaste flag, detecta por rol
    return !!guest || rol === "invitado";
  },

  obtenerSesion() {
    const access  = auth.obtenerToken();
    const refresh = auth.obtenerRefreshToken();
    const usuario = safeParse(localStorage.getItem(USER));
    const rol     = auth.obtenerRol();
    const guest   = auth.esInvitado();
    return { access, refresh, usuario, rol, guest, autenticado: !!access };
  },

  tienePermiso(rolesPermitidos) {
    const rolActual = auth.obtenerRol();
    if (!rolActual) return false;
    if (Array.isArray(rolesPermitidos)) return rolesPermitidos.includes(rolActual);
    return rolActual === rolesPermitidos;
  },
};
