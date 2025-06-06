import { Link } from "react-router-dom";
import React from "react";
import ZOE from "../assets/images/home/ZOE.gif";
import "../assets/css/header.css";

export function Header() {
  return (
    <header className="bg-dark text-white shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-4">
        <div className="d-flex align-items-center">
          <div className="contenido-imagen me-3">
            <img src={ZOE} alt="Logo de la empresa" />
          </div>
          <h3 className="m-0">
            <Link to="/" className="titulo-empresa text-white text-decoration-none fw-bold">
              Variedad y Estilos ZOE
            </Link>
          </h3>
        </div>

        <nav>
          <ul className="nav">
            <li className="nav-item me-2">
              <Link to="/inventario" className="nav-link enlace-boton px-3">
                Inventario
              </Link>
            </li>
            <li className="nav-item me-2">
              <Link to="/rol" className="nav-link enlace-boton px-3">
                Rol
              </Link>
            </li>
            <li className="nav-item me-2">
              <Link to="/proveedores" className="nav-link enlace-boton px-3">
                Proveedor
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/sesion" className="nav-link enlace-boton px-3">
                Sesión
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}