import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaChevronDown } from "react-icons/fa";
import { fetchCarritos } from "../../api/CarritoApi";
import { useAuth } from "../../context/AuthContext";
import ZOE from "../../assets/images/home/ZOE.gif";
import "../../assets/css/header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export function Header() {
  const [cantidadCarrito, setCantidadCarrito] = useState(0);
  const { autenticado, usuario, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    setShowConfirm(true);
  };

  const confirmLogout = () => {
    setShowConfirm(false);
    logout();
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

  const cargarCantidadCarrito = async () => {
    if (!autenticado) {
      setCantidadCarrito(0);
      return;
    }

    try {
      const response = await fetchCarritos();
      const carritosActivos = response.data.filter(c => c.estado === true);
      
      if (carritosActivos.length > 0) {
        const carritoActivo = carritosActivos[0];
        const cantidad = carritoActivo.items ? carritoActivo.items.length : 0;
        setCantidadCarrito(cantidad);
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
    
    // Actualizar cada 5 segundos
    const interval = setInterval(cargarCantidadCarrito, 5000);
    return () => clearInterval(interval);
  }, [autenticado]);

  // Función para escuchar cambios en el carrito desde otros componentes
  useEffect(() => {
    const handleCarritoActualizado = () => {
      cargarCantidadCarrito();
    };

    window.addEventListener('carritoActualizado', handleCarritoActualizado);
    return () => window.removeEventListener('carritoActualizado', handleCarritoActualizado);
  }, []);

  return (
    <>
      {showConfirm && (
        <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar cierre de sesión</h5>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cancelLogout}>Cancelar</button>
                <button className="btn btn-danger" onClick={confirmLogout}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="bg-dark text-white shadow-sm">
        <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-4">
          <div className="d-flex align-items-center gap-3">
            <div className="contenido-imagen">
              <img src={ZOE} alt="Logo de la empresa" />
            </div>
            <h3 className="m-0">
              <Link
                to="/"
                className="titulo-empresa text-white text-decoration-none fw-bold"
              >
                Variedad y Estilos ZOE
              </Link>
            </h3>
          </div>
          <nav>
            <ul className="nav align-items-center gap-2">
              <li className="nav-item">
                <Link
                  to="/"
                  className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
                >
                  <i className="bi bi-house-door-fill"></i> Inicio
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/catalogo"
                  className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i> Catálogo
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/carrito"
                  className="nav-link enlace-boton px-3 d-flex align-items-center gap-2 position-relative"
                >
                  <i className="bi bi-cart3"></i> Carrito
                  {cantidadCarrito > 0 && (
                    <span className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
                      {cantidadCarrito}
                    </span>
                  )}
                </Link>
              </li>
              {autenticado ? (
                <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="nav-link enlace-boton px-3 d-flex align-items-center gap-2 dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle"></i> {usuario.username}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <Link to="/perfil" className="dropdown-item">
                        Mi Perfil
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </li>
              ) : (
                <li className="nav-item">
                  <Link
                    to="/sesion"
                    className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-person-circle"></i> Sesión
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
