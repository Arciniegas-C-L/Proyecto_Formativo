import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/BACKEND/api/usuario/";
const REFRESH_URL = "http://127.0.0.1:8000/BACKEND/api/token/refresh/";

const ACCESS = "access_token";
const REFRESH = "refresh_token";
const USER = "usuario";

const UsuarioApi = axios.create({ baseURL: API_BASE_URL });

UsuarioApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

UsuarioApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem(REFRESH);
        if (refresh) {
          const { data } = await axios.post(REFRESH_URL, { refresh });
          const newAccess = data.access;
          localStorage.setItem(ACCESS, newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return UsuarioApi(originalRequest);
        }
      } catch (refreshError) {
        console.error("Error refrescando token:", refreshError);
        logoutUsuario(); // ← limpiar sesión si falla
        // window.location.href = "/login"; // opcional redirección
      }
    }

    return Promise.reject(error);
  }
);

export const registerUsuario = (usuario) => UsuarioApi.post("register/", usuario);

export const loginUsuario = async (credenciales) => {
  const { data } = await UsuarioApi.post("login/", credenciales);

  const access = data?.token?.access || data.access;
  const refresh = data?.token?.refresh || data.refresh;

  if (access && refresh) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  }

  if (data.usuario) {
    localStorage.setItem(USER, JSON.stringify(data.usuario));
  }

  return data;
};

export const solicitarRecuperacion = (data) => UsuarioApi.post("recuperar_contrasena/", data);
export const resetearContrasena = (data) => UsuarioApi.post("reset_password/", data);

export const fetchUsuario = () => UsuarioApi.get("");
export const updateUsuario = (id, usuario) => UsuarioApi.put(`${id}/`, usuario);

export const logoutUsuario = () => {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
};
