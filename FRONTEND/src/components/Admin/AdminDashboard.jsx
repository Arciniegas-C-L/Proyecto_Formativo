import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FaUsers,
  FaBoxOpen,
  FaWarehouse,
  FaTags,
  FaUserShield,
  FaRuler,
  FaSignOutAlt,
  FaCog,
  FaHome,
  FaBars,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import "../../assets/css/Admin/AdminDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const AdminDashboard = () => {
  const { logout, usuario } = useAuth();
  const location = useLocation();
  const [barraLateralColapsada, setBarraLateralColapsada] = useState(false);
  const [mostrarModalCerrarSesion, setMostrarModalCerrarSesion] =
    useState(false);

  const manejarCerrarSesion = () => setMostrarModalCerrarSesion(true);
  const confirmarCerrarSesion = () => {
    logout();
    window.location.href = "/sesion";
  };
  const cancelarCerrarSesion = () => setMostrarModalCerrarSesion(false);
  const alternarBarraLateral = () =>
    setBarraLateralColapsada(!barraLateralColapsada);

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
    { ruta: "/admin/usuarios", icono: FaUserShield, etiqueta: "Usuarios" },
    { ruta: "/admin/tallas", icono: FaRuler, etiqueta: "Tallas" },
    { ruta: "/admin/tallas/grupo", icono: FaRuler, etiqueta: "Grupo Tallas" },
    { ruta: "/admin/reporte-ventas", icono: FaTags, etiqueta: "Reporte Ventas" },
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
        <div className="encabezado-barra-lateral">
          <div className="contenedor-marca">
            <div className="icono-marca">
              <FaCog />
            </div>
            <div className="texto-marca">
              <h4 className="titulo-marca"> Panel de Administración</h4>
            </div>
          </div>
          {/* X siempre visible */}
          <button
            className="boton-alternar-barra-lateral"
            onClick={alternarBarraLateral}
            aria-label="Cerrar menú"
          >
            <FaTimes />
          </button>
        </div>

        {/* Info usuario */}
        <div className="info-usuario-barra-lateral">
          <div className="avatar-usuario">
            <FaUserCircle />
          </div>
          <div className="detalles-usuario">
            <span className="rol-usuario">    Administrador </span>
          </div>
        </div>

        {/* Menú */}
        <nav className="navegacion-barra-lateral">
          <ul className="menu-navegacion">
            {elementosMenu.map((el, i) => {
              const Icono = el.icono;
              return (
                <li key={i} className="elemento-navegacion-admin">
                  <Link
                    to={el.ruta}
                    className={`enlace-navegacion-admin ${
                      esRutaActiva(el.ruta) ? "activo" : ""
                    }`}
                  >
                    <div className="contenedor-icono-navegacion">
                      <Icono className="icono-navegacion-admin" />
                    </div>
                    <span className="texto-navegacion-admin">
                      {el.etiqueta}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer sidebar */}
          <div className="pie-barra-lateral">
            <button
              className="admin-logout-btn"
              onClick={manejarCerrarSesion}
              aria-label="Cerrar sesión"
            >
              <div className="contenedor-icono-cerrar-sesion">
                <FaSignOutAlt />
              </div>
              <span className="texto-cerrar-sesion">Cerrar Sesión</span>
            </button>
          </div>
      </aside>

      {/* Botón hamburguesa - SOLO cuando sidebar colapsado */}
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