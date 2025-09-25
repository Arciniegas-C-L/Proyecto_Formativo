import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../auth/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [sesion, setSesion] = useState(auth.obtenerSesion());

  useEffect(() => {
    // Puedes agregar lógica adicional aquí si el token debe verificarse
    setSesion(auth.obtenerSesion());
  }, []);

  const login = ({ access, refresh, usuario, rol }) => {
    auth.guardarSesion({ access, refresh, usuario, rol });
    setSesion(auth.obtenerSesion());
  };

  const logout = () => {
    auth.limpiarSesion();
    setSesion({ access: null, refresh: null, usuario: null, rol: null, autenticado: false });
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
