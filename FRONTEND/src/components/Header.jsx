import { Link } from "react-router-dom";
import React from "react";
import ZOE from "../assets/images/home/ZOE.gif";
import "../assets/css/Header.css";

export function Header() {
    return (
        <section className="nombre-empresa">
            <div className="nombre-de-empresa">
                <div className="contenido-imagen">
                    <img src={ZOE} alt="Logo de la empresa" />
                </div>
                <h3><Link to="/home" className="titulo-empresa">Variedad y Estilos ZOE</Link></h3>
                <div className="navegacion">
                    <ul>
                        <li>
                            <Link to="/inventario">Inventario</Link>
                        </li>
                        <li>
                            <Link to="/rol">Rol</Link>
                        </li>
                        <li>
                            <Link to="/proveedores">Proveedor</Link>
                        </li>
                        <li>
                            <Link to="/sesion">Sesión</Link>
                        </li>
                        <li>
                            <Link to="/usuario">Gestion Usuarios</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
