import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ZOE from "../../assets/images/home/ZOE.gif";
import "../../assets/css/header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export function Header() {
  const { autenticado, rol, logout } = useAuth();
  const [menu, setMenu] = useState([]);

  // cliente / público
  useEffect(() => {
    if (!autenticado) {
      setMenu([
        { path: "/", label: "Inicio", icon: "bi-house-door-fill" },
        { path: "/sesion", label: "Sesión", icon: "bi-person-circle" },
      ]);
    } else if (rol === "cliente") {
      setMenu([
        { path: "/", label: "Inicio", icon: "bi-house-door-fill" },
        { path: "/catalogo", label: "Catálogo", icon: "bi-bag-fill" },
        { path: "/perfil", label: "Perfil", icon: "bi-person-badge-fill" },
        { path: "/carrito", label: "Carrito", icon: "bi-cart-fill" },
      ]);
    } else {
      setMenu([]); // admin se pinta abajo con dropdowns
    }
  }, [rol, autenticado]);

  const linkCls = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 px-3 " + (isActive ? "active fw-semibold" : "");

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
