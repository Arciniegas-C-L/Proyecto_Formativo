import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ZOE from "../../assets/images/home/ZOE.gif";
import "../../assets/css/header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export function Header() {
  const { autenticado, rol, logout } = useAuth();
  const [menu, setMenu] = useState([]);

  // 🔹 cuando rol cambie, actualizamos dinámicamente el menú
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
    } else if (rol === "administrador") {
      setMenu([
        { path: "/", label: "Inicio", icon: "bi-house-door-fill" },
        { path: "/perfil", label: "Perfil", icon: "bi-person-badge-fill" },
        { path: "/proveedores", label: "Proveedores", icon: "bi-truck" },
        { path: "/administrador", label: "Registros Proveedores", icon: "bi-journal-text" },
        { path: "/inventario", label: "Inventario", icon: "bi-box-seam" },
        { path: "/producto", label: "Productos", icon: "bi-basket-fill" },
        { path: "/categorias", label: "Categorías", icon: "bi-tags-fill" },
        { path: "/tallas", label: "Tallas", icon: "bi-rulers" },
        { path: "/grupo-talla", label: "Grupo Talla", icon: "bi-diagram-3-fill" },
        { path: "/rol", label: "Roles", icon: "bi-person-lines-fill" },
        { path: "/rol-create", label: "Crear Rol", icon: "bi-person-plus-fill" },
      ]);
    }
  }, [rol, autenticado]);

  return (
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
            {menu.map((item) => (
              <li className="nav-item" key={item.path}>
                <Link
                  to={item.path}
                  className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
                >
                  <i className={`bi ${item.icon}`}></i> {item.label}
                </Link>
              </li>
            ))}

            {autenticado && (
              <li className="nav-item">
                <button
                  onClick={logout}
                  className="btn btn-sm btn-outline-light ms-3"
                >
                  Salir
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
