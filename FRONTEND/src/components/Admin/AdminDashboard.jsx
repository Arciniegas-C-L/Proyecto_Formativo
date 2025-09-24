import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FaUsers,
  FaBoxOpen,
  FaWarehouse,
  FaTags,
  FaUserShield,
  FaRuler,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
} from "react-icons/fa";
import "../../assets/css/Admin/AdminDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [barraLateralColapsada, setBarraLateralColapsada] = useState(false);
  const [mostrarModalCerrarSesion, setMostrarModalCerrarSesion] =
    useState(false);

  const manejarCerrarSesion = () => setMostrarModalCerrarSesion(true);
  const confirmarCerrarSesion = () => {
    logout();
    navigate("/", { replace: true });
  };
  const cancelarCerrarSesion = () => setMostrarModalCerrarSesion(false);
  const alternarBarraLateral = () =>
    setBarraLateralColapsada(!barraLateralColapsada);

  // Función para ir al home de forma rápida
  const irAlInicio = () => {
    navigate("/", { replace: true });
  };

  const esRutaActiva = (ruta) =>
    location.pathname === ruta || location.pathname.startsWith(ruta + "/");

  const elementosMenu = [
    { ruta: "/admin/proveedores", icono: FaUsers, etiqueta: "Proveedores" },
    {
      ruta: "/admin/proveedores/registrados",
      icono: FaUsers,
      etiqueta: "Prov. Registrados",
    },
    { ruta: "/admin/productos", icono: FaBoxOpen, etiqueta: "Productos" },
    {
      ruta: "/admin/productos/crear",
      icono: FaBoxOpen,
      etiqueta: "Crear Producto",
    },
    { ruta: "/admin/inventario", icono: FaWarehouse, etiqueta: "Inventario" },
    { ruta: "/admin/categorias", icono: FaTags, etiqueta: "Categorías" },
    //{ ruta: "/admin/usuarios", icono: FaUserShield, etiqueta: "Usuarios" },
    { ruta: "/admin/tallas", icono: FaRuler, etiqueta: "Tallas" },
    { ruta: "/admin/tallas/grupo", icono: FaRuler, etiqueta: "Grupo Tallas" },
    { ruta: "/admin/reporte-ventas", icono: FaTags, etiqueta: "Reporte Ventas" },
    { ruta: "/", icono: FaHome, etiqueta: "Inicio" },
    { ruta: "/admin/dashboard", icono: FaHome, etiqueta: "Dashboard" },
    { ruta: "/Facturas", icono: FaUserShield, etiqueta: "Facturas" },
    { ruta: "/admin/pedidos", icono: FaTags, etiqueta: "Pedidos" },
  ];

  return (
    <>
      {/* Modal cerrar sesión */}
      {mostrarModalCerrarSesion && (
        <div className="superposicion-modal-admin">
          <div className="contenido-modal-admin">
            <div className="encabezado-modal-admin">
              <h5 className="titulo-modal-admin">Confirmar cierre de sesión</h5>
            </div>
            <div className="cuerpo-modal-admin">
              <p>¿Estás seguro de que deseas cerrar sesión?</p>
            </div>
            <div className="pie-modal-admin">
              <button
                className="boton-cancelar-modal-admin"
                onClick={cancelarCerrarSesion}
              >
                Cancelar
              </button>
              <button
                className="boton-confirmar-modal-admin"
                onClick={confirmarCerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay móvil */}
      {!barraLateralColapsada && (
        <div
          className="superposicion-barra-lateral d-lg-none"
          onClick={alternarBarraLateral}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`barra-lateral-admin ${
          barraLateralColapsada ? "colapsada" : ""
        }`}
      >
        {/* HEADER */}
        <div className="encabezado-completo-sidebar">
          <div className="contenedor-logo-principal">
            <img 
              src="/src/assets/images/home/ZOE copy.gif" 
              alt="Logo ZOE" 
              className="logo-principal"
            />
          </div>
          
          <div className="contenedor-titulo-admin">
            <h4 className="titulo-panel-admin">Panel de Administración</h4>
          </div>

          <button
            className="boton-cerrar-sidebar"
            onClick={alternarBarraLateral}
            aria-label="Cerrar menú"
          >
            <FaTimes />
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="navegacion-principal">
          <ul className="lista-menu-admin">
            {elementosMenu.map((el, i) => {
              const Icono = el.icono;
              return (
                <li key={i} className="item-menu-admin">
                  <Link
                    to={el.ruta}
                    className={`enlace-menu-admin ${
                      esRutaActiva(el.ruta) ? "activo" : ""
                    }`}
                  >
                    <Icono className="icono-menu-admin" />
                    <span className="texto-menu-admin">{el.etiqueta}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sección de navegación */}
        <div className="seccion-navegacion-admin">
          <button
            className="boton-volver-inicio"
            onClick={irAlInicio}
            aria-label="Volver al inicio"
          >
            <FaHome className="icono-volver" />
            <span className="texto-volver">Volver al Inicio</span>
          </button>
          
          <button
            className="boton-logout-principal"
            onClick={manejarCerrarSesion}
            aria-label="Cerrar sesión"
          >
            <FaSignOutAlt className="icono-logout" />
            <span className="texto-logout">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Botón hamburguesa */}
      {barraLateralColapsada && (
        <button
          className="boton-hamburguesa"
          onClick={alternarBarraLateral}
          aria-label="Abrir menú"
        >
          <FaBars />
        </button>
      )}
    </>
  );
};

export default AdminDashboard;