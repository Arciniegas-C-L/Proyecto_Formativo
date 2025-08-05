import { useState, useEffect } from 'react';
import { isAuthenticated, obtenerRol } from './authService';

export const useAuth = () => {
  const [auth, setAuth] = useState({
    isAuth: false,
    rol: null,
  });

  useEffect(() => {
    setAuth({
      isAuth: isAuthenticated(),
      rol: obtenerRol(),
    });
  }, []);

  return auth;
};
