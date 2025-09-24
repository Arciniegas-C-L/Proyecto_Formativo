import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { fetchCarritos } from "../../api/CarritoApi";
import { useAuth } from "../../context/AuthContext";
import ZOE from "../../assets/images/home/ZOE.gif";
import "../../assets/css/SinglePage/Header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
// NUEVO
import {AdminStockNotifications} from "../../components/Notificaciones/AdminStockNotifications";


export function Header() {
  const { autenticado, logout, rol, usuario } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const rolNorm = React.useMemo(() => {
  // candidatos posibles
  const candidates = [
    rol,
    usuario?.rol,
    usuario?.role,
    Array.isArray(rol) ? rol[0] : undefined,
    Array.isArray(usuario?.roles) ? usuario.roles[0] : undefined,
  ];

  // toma el primero definido y extrae texto
  let raw = candidates.find(v => v != null);

  if (typeof raw === "object") {
    raw = raw?.nombre ?? raw?.role ?? raw?.slug ?? "";
  }
  return String(raw ?? "").trim().toLowerCase(); // "cliente", "administrador", etc.
}, [rol, usuario]);

  const esCliente = rolNorm === "cliente";
  const esAdministrador = rolNorm === "administrador";

  const handleLogout = () => {
    setShowConfirm(true);
    setShowDropdown(false);
  };

  const confirmLogout = () => {
    setShowConfirm(false);
    try {
      logout();
      // redirige al home tras cerrar sesión
      navigate("/", { replace: true });
    } catch {
      navigate("/", { replace: true });
    }
  };

  const cancelLogout = () => setShowConfirm(false);

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  // Función para ir al panel de admin directamente
  const goToAdminPanel = () => {
    setShowDropdown(false);
    navigate("/admin/proveedores");
  };

  // Cerrar dropdown si clic fuera del contenedor
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar cantidad del carrito
  const cargarCantidadCarrito = async () => {
    if (!autenticado) {
      setCantidadCarrito(0);
      return;
    }
    try {
      const response = await fetchCarritos();
      const lista = Array.isArray(response?.data) ? response.data : [];
      const carritosActivos = lista.filter((c) => c?.estado === true);
      if (carritosActivos.length > 0) {
        const items = Array.isArray(carritosActivos[0]?.items) ? carritosActivos[0].items : [];
        setCantidadCarrito(items.length);
      } else {
        setCantidadCarrito(0);
      }
    } catch (error) {
      console.error("Error al cargar cantidad del carrito:", error);
      setCantidadCarrito(0);
    }
  };

  useEffect(() => {
    cargarCantidadCarrito();
    const interval = setInterval(cargarCantidadCarrito, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  useEffect(() => {
    const handleCarritoActualizado = () => cargarCantidadCarrito();
    window.addEventListener("carritoActualizado", handleCarritoActualizado);
    return () => window.removeEventListener("carritoActualizado", handleCarritoActualizado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {showConfirm && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">Confirmar cierre de sesión</h5>
            </div>
            <div className="modal-body-custom">
              <p>¿Estás seguro de que deseas cerrar sesión?</p>
            </div>
            <div className="modal-footer-custom">
              <button className="btn-modal-cancel" onClick={cancelLogout}>
                Cancelar
              </button>
              <button className="btn-modal-confirm" onClick={confirmLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="header-custom">
        <div className="header-container">
          <div className="header-brand">
            <div className="logo-container">
              <img src={ZOE} alt="Logo ZOE" className="logo-img" />
            </div>
            <h3 className="brand-title">
              <Link to="/" className="brand-link">
                Variedad y Estilos ZOE
              </Link>
            </h3>
          </div>

          <nav className="header-nav">
            <ul className="nav-list">
              <li className="nav-item-custom">
                <Link to="/" className="nav-link-custom">
                  <i className="bi bi-house-door-fill nav-icon"></i>
                  <span className="nav-text">Inicio</span>
                </Link>
              </li>

              <li className="nav-item-custom">
                <Link to="/catalogo" className="nav-link-custom">
                  <i className="bi bi-grid-3x3-gap-fill nav-icon"></i>
                  <span className="nav-text">Catálogo</span>
                </Link>
              </li>

              <li className="nav-item-custom">
                <Link to="/carrito" className="nav-link-custom cart-link">
                  <i className="bi bi-cart3 nav-icon"></i>
                  <span className="nav-text">Carrito</span>
                  {autenticado && cantidadCarrito > 0 && (
                    <span className="cart-badge">{cantidadCarrito}</span>
                  )}
                </Link>
              </li>

              {autenticado ? (
                <li className="nav-item-custom dropdown-custom" ref={dropdownRef}>
                  <button className="nav-link-custom dropdown-btn" onClick={toggleDropdown}>
                    <div className="user-info">
                      <i className="bi bi-person-circle nav-icon user-icon"></i>
                      <span className="user-name">
                        {usuario?.nombre || usuario?.username || "Usuario"}
                      </span>
                      <i className="bi bi-chevron-down dropdown-arrow"></i>
                    </div>
                  </button>

                  {showDropdown && (
                    <ul className="dropdown-menu-custom">
                      <li>
                        <Link
                          to="/perfil"
                          className="dropdown-item-custom"
                          onClick={() => setShowDropdown(false)}
                        >
                          <i className="bi bi-person-gear"></i> Mi Perfil
                        </Link>
                      </li>

                     {/* Solo CLIENTE: Mis pedidos */}
                      {esCliente && (
                        <li>
                          <Link
                            to="/Mispedidos"
                            className="dropdown-item-custom"
                            onClick={() => setShowDropdown(false)}
                          >
                            <i className="bi bi-bag-check"></i> Mis pedidos
                          </Link>
                        </li>
                      )}
                      {/* NUEVO: Facturas (ruta privada /Facturas) */}
                      { esCliente && (
                      <li>
                        <Link
                          to="/Facturas"
                          className="dropdown-item-custom"
                          onClick={() => setShowDropdown(false)}
                        >
                          <i className="bi bi-receipt"></i> Facturas
                        </Link>
                      </li>
                    )}
                      <li>
                        <button className="dropdown-item-custom logout-btn" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
              ) : (
                <li className="nav-item-custom">
                  <Link to="/sesion" className="nav-link-custom">
                    <i className="bi bi-person-circle nav-icon"></i>
                    <span className="nav-text">Sesión</span>
                  </Link>
                </li>
              )}{" "}
            </ul>
          </nav>
        </div>
      </header>
      {/* 🔔 Sticker flotante de notificaciones solo para admin */}
      <AdminStockNotifications
      isAdmin={esAdministrador}
      onGoToInventario={({ inventarioId, producto, talla }) => {
        // navega a donde quieras ver/editar el inventario
        // Ejemplo: una vista admin de inventario con querystring
        navigate(`/admin/inventario?inventario_id=${inventarioId}`);
      }}
      // pollMs={30000} // opcional: refresco cada 30s (default)
    />
    </>
  );
}