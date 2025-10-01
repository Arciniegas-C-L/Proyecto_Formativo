import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { fetchCarritos } from "../../api/CarritoApi";
import { useAuth } from "../../context/AuthContext";
import { generateAvatarUrl } from "../../utils/avatar";
import ZOE from "../../assets/images/home/ZOE.gif";
import "../../assets/css/SinglePage/Header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export function Header() {
  const { autenticado, rol, logout, usuario } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Normaliza el rol (cliente, administrador, etc.)
  const rolNorm = React.useMemo(() => {
    const candidates = [
      rol,
      usuario?.rol,
      usuario?.role,
      Array.isArray(rol) ? rol[0] : undefined,
      Array.isArray(usuario?.roles) ? usuario.roles[0] : undefined,
    ];
    let raw = candidates.find(v => v != null);
    if (typeof raw === "object") {
      raw = raw?.nombre ?? raw?.role ?? raw?.slug ?? "";
    }
    return String(raw ?? "").trim().toLowerCase();
  }, [rol, usuario]);

  const esAdministrador = rolNorm === "administrador" || rolNorm === "admin";
  const esCliente = rolNorm === "cliente";

  const handleLogout = () => {
    setShowConfirm(true);
    setShowDropdown(false);
  };

  const confirmLogout = () => {
    setShowConfirm(false);
    try {
      logout();
      navigate("/", { replace: true });
    } catch {
      navigate("/", { replace: true });
    }
  };

  const cancelLogout = () => setShowConfirm(false);

  const toggleDropdown = () => setShowDropdown(prev => !prev);

  const goToAdminPanel = () => {
    setShowDropdown(false);
    navigate("/admin/proveedores");
  };

  // Cerrar dropdown clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cantidad de carrito (solo si autenticado)
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
        <div className="modal-overlay-confirm">
          <div className="modal-content-confirm">
            <div className="modal-header-confirm">
              <h5 className="modal-title-confirm">Confirmar cierre de sesión</h5>
            </div>
            <div className="modal-body-confirm">
              <p>¿Estás seguro de que deseas cerrar sesión?</p>
            </div>
            <div className="modal-footer-confirm">
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
              <img src={ZOE} alt="Logo ZOE" className="logo-img" loading="lazy" />
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

              {/* Oculta carrito para administradores */}
              {!esAdministrador && (
                <li className="nav-item-custom">
                  <Link to="/carrito" className="nav-link-custom cart-link">
                    <i className="bi bi-cart3 nav-icon"></i>
                    <span className="nav-text">Carrito</span>
                    {autenticado && cantidadCarrito > 0 && (
                      <span className="cart-badge">{cantidadCarrito}</span>
                    )}
                  </Link>
                </li>
              )}

              {autenticado ? (
                <li className="nav-item-custom dropdown-custom" ref={dropdownRef}>
                  <button className="nav-link-custom dropdown-btn" onClick={toggleDropdown}>
                    <div className="user-info">
                      {autenticado && usuario?.avatar_seed ? (
                        <img
                          src={generateAvatarUrl(usuario.avatar_options, usuario.avatar_seed)}
                          alt="Avatar Usuario"
                          className="nav-avatar-img user-icon"
                          style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 8 }}
                        />
                      ) : (
                        <i className="bi bi-person-circle nav-icon user-icon"></i>
                      )}
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

                      {/* Cliente: Mis pedidos + Facturas */}
                      {esCliente && (
                        <>
                          <li>
                            <Link
                              to="/Mispedidos"
                              className="dropdown-item-custom"
                              onClick={() => setShowDropdown(false)}
                            >
                              <i className="bi bi-bag-check"></i> Mis pedidos
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/Facturas"
                              className="dropdown-item-custom"
                              onClick={() => setShowDropdown(false)}
                            >
                              <i className="bi bi-receipt"></i> Facturas
                            </Link>
                          </li>
                        </>
                      )}

                      {/* Admin: acceso al panel */}
                      {esAdministrador && (
                        <li>
                          <button
                            className="dropdown-item-custom"
                            onClick={goToAdminPanel}
                          >
                            <i className="bi bi-speedometer2"></i> Panel de administración
                          </button>
                        </li>
                      )}

                      <li>
                        <hr className="dropdown-divider-custom" />
                      </li>

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
                    {autenticado && usuario?.avatar_seed ? (
                      <img
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${usuario.avatar_seed}`}
                        alt="Avatar Usuario"
                        className="nav-avatar-img"
                        style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 8 }}
                      />
                    ) : (
                      <i className="bi bi-person-circle nav-icon"></i>
                    )}
                    <span className="nav-text">Sesión</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
