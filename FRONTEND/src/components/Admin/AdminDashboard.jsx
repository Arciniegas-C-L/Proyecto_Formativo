import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ZOEAdmin from "../../assets/images/home/ZOEAdmin.gif";
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
  FaStore,
  FaCog,
  FaChartBar,
} from "react-icons/fa";
import "../../assets/css/Admin/AdminDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, rol } = useAuth();
  
  // Estado que persiste en localStorage
  const [barraLateralColapsada, setBarraLateralColapsada] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [mostrarModalCerrarSesion, setMostrarModalCerrarSesion] = useState(false);

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
    setBarraLateralColapsada(true);
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

  // Verificar si es administrador
  const esAdmin = rol === "administrador";

  const elementosMenu = [
    // ========== DASHBOARD PRINCIPAL ==========
    { 
      ruta: "/admin", 
      icono: FaTachometerAlt, 
      etiqueta: "Dashboard",
      seccion: "dashboard"
    },
    {
      ruta: "/admin/perfil",
      icono: FaUserCircle,
      etiqueta: "Perfil",
      seccion: "dashboard",
    },

    // ========== GESTIÓN DE PRODUCTOS ==========
    { 
      ruta: "/admin/categorias", 
      icono: FaTags, 
      etiqueta: "Categorías",
      seccion: "productos"
    },
    { 
      ruta: "/admin/productos", 
      icono: FaBoxOpen, 
      etiqueta: "Lista Productos",
      seccion: "productos"
    },
    { 
      ruta: "/admin/productos/crear", 
      icono: FaPlus, 
      etiqueta: "Crear Producto",
      seccion: "productos"
    },
    ...(esAdmin ? [{
      ruta: "/admin/catalogo",
      icono: FaStore,
      etiqueta: "Vista Catálogo",
      seccion: "productos"
    }] : []),

    // ========== GESTIÓN DE TALLAS ==========
    { 
      ruta: "/admin/tallas", 
      icono: FaRuler, 
      etiqueta: "Gestionar Tallas",
      seccion: "tallas"
    },
    { 
      ruta: "/admin/tallas/grupo", 
      icono: FaCog, 
      etiqueta: "Grupos de Tallas",
      seccion: "tallas"
    },

    // ========== GESTIÓN DE INVENTARIO ==========
    { 
      ruta: "/admin/inventario", 
      icono: FaWarehouse, 
      etiqueta: "Inventario",
      seccion: "inventario"
    },

    // ========== GESTIÓN DE PROVEEDORES ==========
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

    // ========== GESTIÓN DE VENTAS ==========
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
    { 
      ruta: "/admin/reportes/ventas", 
      icono: FaChartBar, 
      etiqueta: "Reporte de Ventas",
      seccion: "ventas"
    },
    {
     ruta: "/admin/ListaUsuarios", 
      icono: FaUsers, 
      etiqueta: "ListaUsuarios",
      seccion: "usuarios"
    },
  ];

  // Agrupar elementos por sección siguiendo el orden de App.jsx
  const seccionesMenu = {
    dashboard: { titulo: "Dashboard Principal", elementos: [] },
    productos: { titulo: "Gestión de Productos", elementos: [] },
    tallas: { titulo: "Gestión de Tallas", elementos: [] },
    inventario: { titulo: "Gestión de Inventario", elementos: [] },
    proveedores: { titulo: "Gestión de Proveedores", elementos: [] },
    ventas: { titulo: "Gestión de Ventas", elementos: [] },
    usuarios: { titulo: "Gestión de Usuarios", elementos: [] }
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
              src={ZOEAdmin}
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