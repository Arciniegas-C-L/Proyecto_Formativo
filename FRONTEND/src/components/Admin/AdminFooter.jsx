// AdminFooter.jsx - Usando tu AuthContext real
import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import "../../assets/css/Admin/AdminFooter.css";

const AdminFooter = () => {
  const { usuario, autenticado } = useAuth();
  
  // Obtener año actual dinámicamente
  const currentYear = new Date().getFullYear();
  
  // Función para obtener nombre del usuario de forma segura
  const getNombreUsuario = () => {
    if (!usuario || !autenticado) return "Sin sesión";
    return usuario.nombre || usuario.username || usuario.email || "Usuario";
  };
  
  // Estado del sistema basado en autenticación
  const getEstadoSistema = () => {
    return autenticado ? "Sistema Activo" : "Sistema Inactivo";
  };

  return (
    <div className="contenedor-footer-admin">
      <div className="pie-footer-admin">
        <div className="copyright-admin">
          <span>
            <strong>© {currentYear} Variedad y Estilos ZOE.</strong> Dashboard - Panel de Administración
          </span>
        </div>
        <div className="info-sesion-admin">
          <span>
            <strong>{getNombreUsuario()}</strong> | <strong className={autenticado ? 'activo' : 'inactivo'}>{getEstadoSistema()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminFooter;