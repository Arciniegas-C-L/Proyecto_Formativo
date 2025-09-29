import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../auth/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [sesion, setSesion] = useState(auth.obtenerSesion());

  useEffect(() => {
    // Al montar, refresca los datos del usuario desde la API si hay token
    const sesionLocal = auth.obtenerSesion();
    setSesion(sesionLocal);
    if (sesionLocal.access) {
      import('../api/Usuario.api').then(({ fetchUsuario }) => {
        fetchUsuario()
          .then(res => {
            if (res?.data) {
              auth.guardarSesion({
                ...sesionLocal,
                usuario: res.data,
                rol: res.data.rol_nombre || res.data.rol || sesionLocal.rol
              });
              setSesion(auth.obtenerSesion());
            }
          })
          .catch(() => {});
      });
    }
  }, []);

  const login = ({ access, refresh, usuario, rol }) => {
    auth.guardarSesion({ access, refresh, usuario, rol });
    setSesion(auth.obtenerSesion());
  };

  const logout = () => {
    auth.limpiarSesion();
    setSesion({ token: null, usuario: null, rol: null, autenticado: false });
  };

  // Permite actualizar el usuario en el contexto (por ejemplo, tras editar el perfil)
  const updateUsuarioContext = (nuevoUsuario) => {
    setSesion((prev) => ({ ...prev, usuario: nuevoUsuario }));
  };

  return (
    <AuthContext.Provider value={{ ...sesion, login, logout, updateUsuarioContext }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => useContext(AuthContext);
