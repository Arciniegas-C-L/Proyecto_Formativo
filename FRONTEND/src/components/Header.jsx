import { Link } from "react-router-dom";
import React, { useState } from "react";
import { FaShoppingCart, FaChevronDown } from "react-icons/fa";
import ZOE from "../assets/images/home/ZOE.gif";
import "../assets/css/Header.css";

export function Header() {
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    const toggleAdminMenu = () => {
        setShowAdminMenu(!showAdminMenu);
    };

    return (
        <section className="nombre-empresa">
            <div className="nombre-de-empresa">
                <div className="contenido-imagen">
                    <img src={ZOE} alt="Logo de la empresa" />
                </div>
                <h3><Link to="/" className="titulo-empresa">Variedad y Estilos ZOE</Link></h3>
                <div className="navegacion">
                    <ul>
                        <li className="admin-menu">
                            <button 
                                className="admin-button" 
                                onClick={toggleAdminMenu}
                                onBlur={() => setTimeout(() => setShowAdminMenu(false), 200)}
                            >
                                Administrador <FaChevronDown />
                            </button>
                            {showAdminMenu && (
                                <div className="admin-dropdown">
                                    <Link to="/inventario">Inventario</Link>
                                    <Link to="/rol">Rol</Link>
                                    <Link to="/proveedores">Proveedor</Link>
                                    <Link to="/producto"> Producto</Link>
                                    <Link to="/categorias">Categoria</Link>
                                </div>
                            )}
                        </li>
                        <li>
                            <Link to="/catalogo">Catalogo</Link>
                        </li>
                        <li>
                            <Link to="/sesion">Sesión</Link>
                        </li>
                        <li className="carrito-icono">
                            <Link to="/carrito" className="icono-carrito">
                                <FaShoppingCart />
                            </Link>
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
