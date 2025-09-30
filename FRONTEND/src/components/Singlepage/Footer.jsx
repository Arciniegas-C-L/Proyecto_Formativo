import React, { useState } from 'react';
import { FaBuilding, FaInfoCircle, FaHome, FaBoxOpen, FaPhone, FaEnvelope } from 'react-icons/fa';
import FooterModal from './FooterModal';
import { Link } from 'react-router-dom';
import "../../assets/css/SinglePage/Footer.css";


export function Footer() {
  const [modal, setModal] = useState({ open: false, title: '', content: null });

  const handleOpen = (title, content) => setModal({ open: true, title, content });
  const handleClose = () => setModal({ ...modal, open: false });

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-contenido">
          <div className="links">
            <p>Información</p>
            <span className="link" onClick={() => handleOpen('Nuestra Empresa',
              <div style={{textAlign:'left', maxWidth: 480, margin: '0 auto'}}>
                <b>Variedad y Estilos ZOE</b> es una empresa colombiana dedicada a la moda, el estilo y la innovación en productos para toda la familia.<br /><br />
                <b>Misión:</b> Brindar a nuestros clientes una experiencia única, con productos de alta calidad, atención personalizada y compromiso social.<br />
                <b>Visión:</b> Ser reconocidos como líderes en el sector de moda y hogar, destacando por nuestra variedad, responsabilidad y cercanía con la comunidad.<br /><br />
                <b>Valores:</b> Honestidad, pasión, servicio, creatividad y respeto por nuestros clientes y colaboradores.
              </div>
            )}><FaBuilding className="icono-footer" /> Nuestra Empresa</span>
            <span className="link" onClick={() => handleOpen('Sobre Nosotros',
              <div style={{textAlign:'left', maxWidth: 480, margin: '0 auto'}}>
                Somos un equipo apasionado por la moda y el bienestar de las familias colombianas.<br /><br />
                <b>¿Quiénes somos?</b> Un grupo de emprendedores que cree en la diversidad, la inclusión y la importancia de ofrecer productos que se adapten a todos los estilos y necesidades.<br /><br />
                <b>¿Por qué elegirnos?</b> Porque nos esforzamos por ofrecer atención cercana, productos seleccionados y un ambiente de confianza y respeto.<br /><br />
                <b>¡Gracias por ser parte de la familia ZOE!</b>
              </div>
            )}><FaInfoCircle className="icono-footer" /> Sobre Nosotros</span>
          </div>
          <div className="links">
            <p>Acerca de</p>
            <span className="link" onClick={() => handleOpen('Servicios',
              <div style={{textAlign:'left', maxWidth: 480, margin: '0 auto'}}>
                <b>Nuestros servicios incluyen:</b>
                <ul style={{marginTop:8, marginBottom:8, paddingLeft:18}}>
                  <li>Venta de ropa, calzado y accesorios para todas las edades y estilos.</li>
                  <li>Productos para el hogar: decoración, textiles y más.</li>
                  <li>Atención personalizada en tienda física y online.</li>
                  <li>Envíos rápidos y seguros a todo el país.</li>
                  <li>Asesoría en tendencias y moda.</li>
                  <li>Política de cambios y devoluciones flexible.</li>
                </ul>
                <b>¡Queremos que tu experiencia sea memorable en cada compra!</b>
              </div>
            )}><FaBoxOpen className="icono-footer" /> Servicios</span>
            <span
              className="link"
              onClick={() => handleOpen('Términos y Condiciones',
                <div style={{textAlign:'left', maxWidth: 480, margin: '0 auto'}}>
                  <strong>Secciones comunes de Términos y Condiciones</strong>
                  <ul style={{marginTop:8, marginBottom:8, paddingLeft:18}}>
                    <li><b>Introducción y aceptación:</b> Al usar esta página/app aceptas estos Términos y Condiciones (TyC). La empresa responsable es Variedad y Estilos ZOE.</li>
                    <li><b>Uso del servicio:</b> Debes usar la plataforma de forma legal y respetuosa. No está permitido dañar, hackear o robar datos.</li>
                    <li><b>Registro de usuarios:</b> Solo mayores de edad pueden crear cuenta. Los datos deben ser verídicos. Mantén tus credenciales seguras.</li>
                    <li><b>Compras, pagos y facturación:</b> Aceptamos varios métodos de pago. Los precios incluyen impuestos según ley. Facturación según datos proporcionados.</li>
                    <li><b>Envíos, entregas y devoluciones:</b> Envíos según cobertura y plazos informados. Cambios y devoluciones según política vigente.</li>
                    <li><b>Propiedad intelectual:</b> Todos los textos, imágenes y código son propiedad de la empresa. No uses el contenido sin autorización.</li>
                    <li><b>Privacidad y protección de datos:</b> Consulta nuestra Política de Privacidad para saber cómo usamos tus datos.</li>
                    <li><b>Limitación de responsabilidad:</b> No nos hacemos responsables por daños derivados del mal uso del servicio.</li>
                    <li><b>Suspensión o cancelación de cuentas:</b> Podemos suspender cuentas por incumplimiento de estos TyC.</li>
                    <li><b>Modificaciones de los Términos:</b> Los TyC pueden cambiar. Notificaremos los cambios relevantes.</li>
                    <li><b>Jurisdicción y ley aplicable:</b> Este contrato se rige por las leyes de Colombia. Cualquier conflicto será resuelto en los tribunales competentes.</li>
                    <li><b>Contacto:</b> Para dudas, contáctanos a yulenitacollazos.1989@gmail.com</li>
                  </ul>
                </div>
              )}
            >
              <FaInfoCircle className="icono-footer" /> Términos y Condiciones
            </span>
          </div>
          <div className="links">
            <p>Navegación</p>
            <Link to="/" className="link"><FaHome className="icono-footer" /> Home</Link>
            <Link to="/catalogo" className="link"><FaBoxOpen className="icono-footer" /> Productos</Link>
            <Link to="/carrito" className="link"><FaBoxOpen className="icono-footer" /> Carrito</Link>
          </div>
          <div className="links">
            <p>Contacto</p>
            <span className="link"><FaPhone className="icono-footer" />+57 322 4267998</span>
            <span className="link"><FaEnvelope className="icono-footer" />yulenitacollazos.1989@gmail.com</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Variedad y Estilos ZOE. Todos los derechos reservados.</p>
        </div>
      </div>
      <FooterModal open={modal.open} onClose={handleClose} title={modal.title}>{modal.content}</FooterModal>
    </footer>
  );
}