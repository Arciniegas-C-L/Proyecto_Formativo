import { Link } from "react-router-dom";
// import React, { useState } from "react";
import { FaShoppingCart, FaChevronDown } from "react-icons/fa";
import ZOE from "../assets/images/home/ZOE.gif";
import "../assets/css/header.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; 

export function Header() {
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
                to="/inventario"
                className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
              >
                <i className="bi bi-box-seam"></i> Inventario
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/proveedores"
                className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
              >
                <i className="bi bi-truck"></i> Proveedor
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/rol"
                className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
              >
                <i className="bi bi-person-badge"></i> Rol
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/sesion"
                className="nav-link enlace-boton px-3 d-flex align-items-center gap-2"
              >
                <i className="bi bi-person-circle"></i> Sesión
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
