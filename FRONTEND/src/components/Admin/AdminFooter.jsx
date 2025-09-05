import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import "../../assets/css/Admin/AdminFooter.css";

const AdminFooter = () => {
  const { usuario } = useAuth();

  return (
    <div className="contenedor-footer-admin">
      <div className="pie-footer-admin">
        <div className="copyright-admin">
          <span>
            <strong>© 2025 Variedad y Estilos ZOE.</strong> Dashboard - Panel de Administración
          </span>
        </div>
        <div className="info-sesion-admin">
          <span>
            <strong>{usuario?.nombre || usuario?.username}</strong> | <strong>Sistema Activo</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminFooter;
