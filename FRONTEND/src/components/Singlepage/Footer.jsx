import React from 'react';
import { FaBuilding, FaInfoCircle, FaHome, FaBoxOpen, FaPhone } from 'react-icons/fa';
import '../../assets/css/Footer.css';

export function Footer() {
  return (
    <div className="footer">
      <section className="footer-container">
        <div className="container-footer">
          <div className="footer-contenido">
            <div className="footer-main">
            </div>

            <div className="links">
              <p>Información</p>
              <a href="#" className="link"><FaBuilding className="icono-footer" /> Nuestra Empresa</a>
              <a href="#" className="link"><FaInfoCircle className="icono-footer" /> Sobre Nosotros</a>
            </div>

            <div className="links">
              <p>Acerca de</p>
              <a href="#" className="link"><FaBoxOpen className="icono-footer" /> Servicios</a>
              <a href="#" className="link"><FaInfoCircle className="icono-footer" /> Términos y condiciones</a>
            </div>

            <div className="links">
              <p>Navegación</p>
              <a href="#" className="link"><FaHome className="icono-footer" /> Home</a>
              <a href="#" className="link"><FaBoxOpen className="icono-footer" /> Productos</a>
              <a href="#" className="link"><FaBoxOpen className="icono-footer" /> Servicios</a>
              <a href="#" className="link"><FaPhone className="icono-footer" /> Contacto</a>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
