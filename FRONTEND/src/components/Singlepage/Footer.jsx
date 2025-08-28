import React from 'react';
import { FaBuilding, FaInfoCircle, FaHome, FaBoxOpen, FaPhone, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import "../../assets/css/SinglePage/Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-contenido">

          <div className="links">
            <p>Información</p>
            <span className="link"><FaBuilding className="icono-footer" /> Nuestra Empresa</span>
            <span className="link"><FaInfoCircle className="icono-footer" /> Sobre Nosotros</span>
          </div>

          <div className="links">
            <p>Acerca de</p>
            <span className="link"><FaBoxOpen className="icono-footer" /> Servicios</span>
            <span className="link"><FaInfoCircle className="icono-footer" /> Términos y Condiciones</span>
          </div>

          <div className="links">
            <p>Navegación</p>
            <Link to="/" className="link"><FaHome className="icono-footer" /> Home</Link>
            <span className="link"><FaBoxOpen className="icono-footer" /> Productos</span>
            <span className="link"><FaBoxOpen className="icono-footer" /> Servicios</span>
            <span className="link"><FaPhone className="icono-footer" /> Contacto</span>
          </div>

          <div className="links">
            <p>Contacto</p>
            <span className="link"><FaPhone className="icono-footer" /> +57 322 4267998</span>
            <span className="link"><FaEnvelope className="icono-footer" /> yulenitacollazos.1989@gmail.com</span>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© 2025 Variedad y Estilos ZOE. Todos los derechos reservados.</p>
        </div>

      </div>
    </footer>
  );
}
