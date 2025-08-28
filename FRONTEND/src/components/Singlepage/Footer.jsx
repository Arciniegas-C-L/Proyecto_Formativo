import React from 'react';
import { FaBuilding, FaInfoCircle, FaHome, FaBoxOpen, FaPhone } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import "../../assets/css/SinglePage/Footer.css";

export function Footer() {
  return (
    <div className="footer">
      <section className="footer-container">
        <div className="container-footer">
          <div className="footer-contenido">
            <div className="footer-main"></div>

            {/* Información */}
            <div className="links">
              <p>Información</p>
              <span className="link"><FaBuilding className="icono-footer" /> Nuestra Empresa</span>
              <span className="link"><FaInfoCircle className="icono-footer" /> Sobre Nosotros</span>
            </div>

            {/* Acerca de */}
            <div className="links">
              <p>Acerca de</p>
              <span className="link"><FaBoxOpen className="icono-footer" /> Servicios</span>
              <span className="link"><FaInfoCircle className="icono-footer" /> Términos y condiciones</span>
            </div>

            {/* Navegación */}
            <div className="links">
              <p>Navegación</p>
              
              {/* Home funcional */}
              <Link to="/" className="link"><FaHome className="icono-footer" /> Home</Link>
              <span className="link"><FaBoxOpen className="icono-footer" /> Productos</span>
              <span className="link"><FaBoxOpen className="icono-footer" /> Servicios</span>
              <span className="link"><FaPhone className="icono-footer" /> Contacto</span>
            </div>
          </div>
        </div>
      </section>

      <div className="footer-bottom">
        <p>© 2025 Variedad y Estilos ZOE. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}