import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth } from '../auth/authService';
// AuthContext.jsx (o donde se setea autenticado=true)
import { adoptarCarritoAnon } from "../api/CarritoApi";
import { toast } from "react-hot-toast";

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

export function useAdoptCartOnLogin(autenticado) {
  const ran = useRef(false); // evita doble ejecución en StrictMode

  useEffect(() => {
    if (!autenticado) return;
    if (ran.current) return;
    ran.current = true;

    const cartId = localStorage.getItem("cartId");
    if (!cartId) return;

    (async () => {
      try {
        await adoptarCarritoAnon(cartId);        // <-- await
        localStorage.removeItem("cartId");
        window.dispatchEvent(new CustomEvent("carritoActualizado"));
        toast.success("Se migró tu carrito a tu cuenta");
      } catch (e) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.error || "";

        if (status === 404 && /no encontrado|not found/i.test(msg)) {
          // carrito ya fue adoptado / id obsoleto → tratar como éxito silencioso
          localStorage.removeItem("cartId");
          window.dispatchEvent(new CustomEvent("carritoActualizado"));
          return;
        }

        console.error("No se pudo adoptar el carrito:", e);
        toast.error("No se pudo migrar tu carrito");
      }
    })();
  }, [autenticado]);
}