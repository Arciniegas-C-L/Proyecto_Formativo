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
      ]);
    } else {
      setMenu([]); // admin se pinta abajo con dropdowns
    }
  }, [rol, autenticado]);

  const linkCls = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 px-3 " + (isActive ? "active fw-semibold" : "");

  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container-fluid px-3">

        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={ZOE} alt="Logo" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          <span className="fw-bold">Variedad y Estilos <span className="text-info">ZOE</span></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          {/* ====== ADMIN ====== */}
          {autenticado && rol === "administrador" ? (
            <>
              {/* IZQUIERDA: Inicio solo */}
              <ul className="navbar-nav">
                <li className="nav-item">
                  <NavLink to="/" className={linkCls}>
                    <i className="bi bi-house-door-fill" /> Inicio
                  </NavLink>
                </li>
              </ul>

              {/* CENTRO: dropdowns */}
              <ul className="navbar-nav mx-auto">

                {/* Proveedores */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link px-3 text-decoration-none"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-truck" /> Proveedores
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <NavLink to="/proveedores" className="dropdown-item">
                        Proveedores
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/administrador" className="dropdown-item">
                        Registro de Proveedores
                      </NavLink>
                    </li>
                  </ul>
                </li>

                {/* Gestión */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link px-3 text-decoration-none"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-collection-fill" /> Gestión
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <NavLink to="/inventario" className="dropdown-item">
                        <i className="bi bi-box-seam me-2" /> Inventario
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/producto" className="dropdown-item">
                        <i className="bi bi-basket-fill me-2" /> Productos
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/categorias" className="dropdown-item">
                        <i className="bi bi-tags-fill me-2" /> Categorías
                      </NavLink>
                    </li>
                  </ul>
                </li>

                {/* Tallas */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link px-3 text-decoration-none"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-rulers" /> Tallas
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <NavLink to="/tallas" className="dropdown-item">
                        Tallas
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/grupo-talla" className="dropdown-item">
                        Grupo Talla
                      </NavLink>
                    </li>
                  </ul>
                </li>

                {/* Roles */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link px-3 text-decoration-none"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-lines-fill" /> Roles
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <NavLink to="/rol" className="dropdown-item">
                        Roles
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/rol-create" className="dropdown-item">
                        Crear Rol
                      </NavLink>
                    </li>
                  </ul>
                </li>
              </ul>

              {/* DERECHA: Perfil, Usuario, Salir */}
              <ul className="navbar-nav ms-auto align-items-center">
                {/* Perfil */}
                <li className="nav-item dropdown">
  <button
    className="nav-link dropdown-toggle btn btn-link px-3 text-decoration-none"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
    <i className="bi bi-person-badge-fill" /> Perfil
  </button>
  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark">
    <li>
      <NavLink to="/perfil" className="dropdown-item">
        Ver perfil
      </NavLink>
    </li>
    <li>
      <hr className="dropdown-divider" />
    </li>
    <li>
      <button onClick={logout} className="dropdown-item text-danger">
        <i className="bi bi-box-arrow-right me-2"></i> Salir
      </button>
    </li>
  </ul>
</li>

                {/* Usuario */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link px-3 text-decoration-none"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-people-fill" /> Usuario
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark">
                    <li>
                      <NavLink to="/usuario" className="dropdown-item">
                        Usuarios
                      </NavLink>
                    </li>
                  </ul>
                </li>

                {/* Salir */}
                <li className="nav-item ms-2">
                  <button onClick={logout} className="btn btn-outline-light btn-sm">
                    Salir
                  </button>
                </li>
              </ul>
            </>
          ) : (
            /* ====== CLIENTE / PÚBLICO ====== */
            <ul className="navbar-nav ms-auto align-items-center">
              {menu.map((item) => (
                <li className="nav-item" key={item.path}>
                  <NavLink to={item.path} className={linkCls}>
                    <i className={`bi ${item.icon}`} /> {item.label}
                  </NavLink>
                </li>
              ))}
              {autenticado && (
                <li className="nav-item ms-2">
                  <button onClick={logout} className="btn btn-outline-light btn-sm">
                    Salir
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
