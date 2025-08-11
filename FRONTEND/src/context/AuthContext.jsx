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
    setSesion({ token: null, usuario: null, rol: null, autenticado: false });
  };

  return (
    <AuthContext.Provider value={{ ...sesion, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => useContext(AuthContext);
