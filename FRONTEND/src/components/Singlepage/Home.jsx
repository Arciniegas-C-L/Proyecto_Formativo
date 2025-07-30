import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/Home.css';
import gorra from '../../assets/images/home/gorra.jpg';
import pareja from '../../assets/images/home/pareja.jpg';
import calzado from '../../assets/images/home/calzado.jpg';
import colcha from '../../assets/images/home/colcha.jpg';
import joven from '../../assets/images/home/joven.jpg';
import anciano from '../../assets/images/home/anciano.jpg';
import mujer from '../../assets/images/home/mujer.jpg';

export const Home = () => {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-contenido text-white text-center">
          <h2 className="hero-titulo">La moda que se adapta a ti.</h2>
          <p className="hero-texto">
            ZOE une variedad, estilo y libertad en cada prenda. Para quienes
            eligen destacar.
          </p>
          <Link to="/catalogo" className="hero-boton btn btn-warning btn-lg">
            Ver Catalogo
          </Link>
        </div>
      </section>

      <section className="productos-destacados">
        <div className="Titulo-productos">
          <hr className="izquierda" />
          <h2>Productos Destacados</h2>
          <hr className="derecha" />
        </div>
        <div className="productos">
          <div className="producto-home">
            <img src={pareja} alt="Ropa para mujeres, hombres y niños" />
            <h2>Ropa para Mujer, Hombre y Niño.</h2>
            <p>
              Ropa de alta calidad para toda la familia: Hombres, mujeres, niños
              y niñas.
            </p>
          </div>
          <div className="producto-home">
            <img src={calzado} alt="Calzado familiar cómodo y moderno" />
            <h2>Calzado para toda la Familia</h2>
            <p>
              Ofrecemos una amplia gama de calzado para hombres, mujeres y
              niños, garantizando comodidad y estilo en cada paso.
            </p>
          </div>
          <div className="producto-home">
            <img src={gorra} alt="Accesorios de moda para todos" />
            <h2>Accesorios y Complementos</h2>
            <p>
              Eleva tu estilo con nuestros bolsos, relojes, gafas y gorras.
              Detalles que hacen la diferencia en tu outfit diario.
            </p>
          </div>
          <div className="producto-home">
            <img src={colcha} alt="Decoración y productos para el hogar" />
            <h2>Productos para el Hogar</h2>
            <p>
              Descubre nuestra selección de productos para el hogar de alta
              calidad: decoración, muebles y accesorios que combinan estilo y
              funcionalidad.
            </p>
          </div>
        </div>
      </section>

      <section className="contenido-clientes">
        <div className="Titulo-productos">
          <hr className="izquierda" />
          <h2>Lo que dicen nuestros clientes</h2>
          <hr className="derecha" />
        </div>
        <div className="comentarios">
          <div className="usuario">
            <div className="usuario-info">
              <img src={joven} alt="Foto de Carlos Vargas" />
              <div className="usuario-detalles">
                <h3>Carlos Vargas</h3>
                <div className="estrellas">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
            </div>
            <div className="comentario-usuario">
              <p>
                "Excelente calidad en la ropa. Los precios son muy accesibles y
                el servicio al cliente es excepcional. ¡Definitivamente volveré
                a comprar!"
              </p>
              <span className="fecha">Hace 2 días</span>
            </div>
          </div>

          <div className="usuario">
            <div className="usuario-info">
              <img src={anciano} alt="Foto de Carlos Rodríguez" />
              <div className="usuario-detalles">
                <h3>Carlos Rodríguez</h3>
                <div className="estrellas">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
              </div>
            </div>
            <div className="comentario-usuario">
              <p>
                "Los productos para el hogar son hermosos y de muy buena
                calidad. La entrega fue rápida y todo llegó en perfecto estado."
              </p>
              <span className="fecha">Hace 1 semana</span>
            </div>
          </div>

          <div className="usuario">
            <div className="usuario-info">
              <img src={mujer} alt="Foto de Ana Martínez" />
              <div className="usuario-detalles">
                <h3>Ana Martínez</h3>
                <div className="estrellas">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
            </div>
            <div className="comentario-usuario">
              <p>
                "Me encanta la variedad de calzado que tienen. Encontré los
                zapatos perfectos para toda mi familia. El asesoramiento fue muy
                profesional."
              </p>
              <span className="fecha">Hace 3 días</span>
            </div>
          </div>
        </div>
      </section>

      <section className="palabras-con-movimiento">
        <div className="palabras">
          <div className="frase">
            <i className="bi bi-star-fill"></i>
            <span>Si te hace sonreír al espejo, es tuyo.</span>
          </div>
          <div className="frase">
            <i className="bi bi-lightning-fill"></i>
            <span>¡Tu energía se nota desde el outfit!</span>
          </div>
          <div className="frase">
            <i className="bi bi-gem"></i>
            <span>Estilo real, sin filtros.</span>
          </div>
        </div>
      </section>
    </>
  );
};