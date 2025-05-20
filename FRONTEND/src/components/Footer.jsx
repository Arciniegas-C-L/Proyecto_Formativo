import {Link} from 'react-router-dom'
import React from 'react'
import '../assets/css/Footer.css'

export function Footer() {
    return (
        <div className="footer">
            <section className="footer-container">
        <div className="container-footer">
          <div className="footer">
            <div className="footer-contenido">
              <div className="footer-main">
                <div className="links-sociales">
                  
                </div>
              </div>
              <div className="links">
                <p>Información</p>
                <a href="#" className="link">Nuestra Empresa</a>
                <a href="#" className="link">Sobre Nosotros</a>
        {/* Sección de pie de página */}
              </div>
              <div className="links">
                <p>Acerca de</p>
                <a href="#" className="link">Servicios</a>
                <a href="#" className="link">Términos y condiciones</a>
              </div>
              <div className="links">
                <p>Navegación</p>
                <a href="#" className="link">Home</a>
                <a href="#" className="link">Productos</a>
                <a href="#" className="link">Servicios</a>
                <a href="#" className="link">Contacto</a>
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
    )
}
