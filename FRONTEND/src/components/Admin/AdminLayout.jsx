import React from "react";
import { Outlet } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminFooter from "./AdminFooter.jsx";
import "../../assets/css/Admin/AdminLayout.css";

export const AdminLayout = () => {
  return (
    <div className="admin-layout">
      {/* Sidebar de navegación */}
      <AdminDashboard />

      {/* Contenedor principal: contenido + footer */}
      <div className="admin-contenido">
        {/* Contenido principal que crece */}
        <div className="contenido-principal">
          <Outlet />
        </div>
        {/* Footer que siempre queda abajo */}
        <AdminFooter />
      </div>
    </div>
  );
};

export default AdminLayout;
