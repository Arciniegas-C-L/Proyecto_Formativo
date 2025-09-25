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
  FaTachometerAlt,
  FaPlus,
  FaList,
  FaShoppingCart,
  FaFileInvoice,
  FaUserCircle,
} from "react-icons/fa";
import "../../assets/css/Admin/AdminDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Estado que persiste en localStorage
  const [barraLateralColapsada, setBarraLateralColapsada] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [mostrarModalCerrarSesion, setMostrarModalCerrarSesion] =
    useState(false);

  // Guardar el estado en localStorage cuando cambie
  React.useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(barraLateralColapsada));
  }, [barraLateralColapsada]);

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
    setBarraLateralColapsada(true); // Cierra el panel
    navigate("/", { replace: true });
  };

  // Determinar el texto y acción del botón según la ruta actual
  const esRutaAdmin = location.pathname.startsWith("/admin");
  const textoBoton = esRutaAdmin ? "Volver al Inicio" : "Volver al Panel";
  const accionBoton = esRutaAdmin 
    ? irAlInicio 
    : () => navigate("/admin", { replace: true });

  const esRutaActiva = (ruta) =>
    location.pathname === ruta || location.pathname.startsWith(ruta + "/");

  const elementosMenu = [
    // PERFIL ADMIN
    {
      ruta: "/admin/perfil",
      icono: FaUserCircle,
      etiqueta: "Perfil",
      seccion: "principal",
    },
    //  DASHBOARD PRINCIPAL - Vista general del sistema
    { 
      ruta: "/admin", 
      icono: FaTachometerAlt, 
      etiqueta: "Dashboard",
      seccion: "principal"
    },

    //  GESTIÓN DE CATEGORÍAS - Base para la organización de productos
    { 
      ruta: "/admin/categorias", 
      icono: FaTags, 
      etiqueta: "Categorías",
      seccion: "catalogo"
    },

    //  GESTIÓN DE TALLAS - Sistema de tallas antes de crear productos
    { 
      ruta: "/admin/tallas/grupo", 
      icono: FaRuler, 
      etiqueta: "Grupos de Tallas",
      seccion: "catalogo"
    },
    { 
      ruta: "/admin/tallas", 
      icono: FaRuler, 
      etiqueta: "Gestionar Tallas",
      seccion: "catalogo"
    },

    //  GESTIÓN DE PRODUCTOS - Crear y administrar productos
    { 
      ruta: "/admin/productos/crear", 
      icono: FaPlus, 
      etiqueta: "Crear Producto",
      seccion: "productos"
    },
    { 
      ruta: "/admin/productos", 
      icono: FaBoxOpen, 
      etiqueta: "Listar Productos",
      seccion: "productos"
    },

    //  INVENTARIO - Gestión de stock
    { 
      ruta: "/admin/inventario", 
      icono: FaWarehouse, 
      etiqueta: "Inventario",
      seccion: "inventario"
    },

    //  GESTIÓN DE PROVEEDORES - Administración de proveedores
    { 
      ruta: "/admin/proveedores", 
      icono: FaUsers, 
      etiqueta: "Gestionar Proveedores",
      seccion: "proveedores"
    },
    { 
      ruta: "/admin/proveedores/registrados", 
      icono: FaList, 
      etiqueta: "Proveedores Registrados",
      seccion: "proveedores"
    },

    //  PEDIDOS Y VENTAS - Gestión comercial
    { 
      ruta: "/admin/pedidos", 
      icono: FaShoppingCart, 
      etiqueta: "Pedidos",
      seccion: "ventas"
    },
    { 
      ruta: "/admin/facturas", 
      icono: FaFileInvoice, 
      etiqueta: "Facturas",
      seccion: "ventas"
    },
  ];

  // Agrupar elementos por sección 
  const seccionesMenu = {
    principal: { titulo: "Dashboard", elementos: [] },
    catalogo: { titulo: "Configuración del Catálogo", elementos: [] },
    productos: { titulo: "Gestión de Productos", elementos: [] },
    inventario: { titulo: "Control de Inventario", elementos: [] },
    proveedores: { titulo: "Gestión de Proveedores", elementos: [] },
    ventas: { titulo: "Pedidos y Facturación", elementos: [] },
  };

  // Clasificar elementos por sección
  elementosMenu.forEach(elemento => {
    if (seccionesMenu[elemento.seccion]) {
      seccionesMenu[elemento.seccion].elementos.push(elemento);
    }
  });

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

        {/* Menú de navegación organizado por secciones */}
        <nav className="navegacion-principal">
          {Object.entries(seccionesMenu).map(([clavSeccion, seccion]) => {
            if (seccion.elementos.length === 0) return null;
            
            return (
              <div key={clavSeccion} className="grupo-menu-admin">
                {/* Título de la sección (solo visible cuando no está colapsada) */}
                <div className="titulo-seccion-menu">
                  <h6 className="texto-titulo-seccion">{seccion.titulo}</h6>
                  <hr className="separador-seccion" />
                </div>

                {/* Lista de elementos de la sección */}
                <ul className="lista-menu-admin">
                  {seccion.elementos.map((el, i) => {
                    const Icono = el.icono;
                    return (
                      <li key={`${clavSeccion}-${i}`} className="item-menu-admin">
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
              </div>
            );
          })}
        </nav>

        {/* Sección de navegación */}
        <div className="seccion-navegacion-admin">
          <button
            className="boton-volver-inicio"
            onClick={accionBoton}
            aria-label={textoBoton}
          >
            <FaHome className="icono-volver" />
            <span className="texto-volver">{textoBoton}</span>
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

      {/* Botón hamburguesa - */}
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