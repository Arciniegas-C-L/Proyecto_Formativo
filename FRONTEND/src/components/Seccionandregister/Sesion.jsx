import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import saludo from "../../assets/images/saludo.webp";
import bienvenida from "../../assets/images/bienvenida.gif";
import "../../assets/css/Seccionandregistrer/sesion.css";
import { loginUsuario, registerUsuario } from '../../api/Usuario.api';
import toast from 'react-hot-toast';

export function Sesion() {
  const containerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignInClick = () => {
    containerRef.current.classList.remove('toggle');
  };

  const handleSignUpClick = () => {
    containerRef.current.classList.add('toggle');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target.elements;
    const correo = form.email.value;
    const password = form.password.value;

    try {
      const response = await loginUsuario({ correo, password });
      
      // Guardar el token en localStorage
      localStorage.setItem('token', response.data.token);
      
      toast.success("Inicio de sesión exitoso");
      navigate('/');
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Credenciales inválidas";
      toast.error("Error: " + errorMsg);
    }

    setIsSubmitting(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target.elements;

    const nombre = form.nombre.value;
    const apellido = form.apellido.value;
    const telefono = form.telefono.value;
    const correo = form.correo.value;
    const password = form.password.value;

    try {
      await registerUsuario({
        nombre,
        apellido,
        correo,
        password,
        telefono,
      });

      toast.success("Registro exitoso. Ahora inicia sesión.");
      containerRef.current.classList.remove('toggle');
    } catch (error) {
      toast.error("Error: " + JSON.stringify(error.response?.data || {}));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="container-sesion">
      <div className="container" ref={containerRef}>
        <div className="container-form">
          <form className="sign-in" onSubmit={handleLogin}>
            <h2>Iniciar Sesión</h2>
            <span>Use su correo y contraseña</span>
            <div className="container-input">
              <input type="email" name="email" placeholder="Correo" required />
            </div>
            <div className="container-input">
              <input type="password" name="password" placeholder="Contraseña" required />
            </div>
            <Link to="recuperar_contrasena/" className="forgot-password">¿Olvidaste tu contraseña?</Link>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "Iniciar Sesión "}
            </button>
          </form>
        </div>

        <div className="container-form">
          <form className="sign-up" onSubmit={handleRegister}>
            <h2>Registrarse</h2>
            <span>Use su correo electrónico para registrarse</span>
            <div className="container-input">
              <input type="text" name="nombre" placeholder="Nombre" required />
            </div>
            <div className="container-input">
              <input type="text" name="apellido" placeholder="Apellido" required />
            </div>
            <div className="container-input">
              <input type="tel" name="telefono" placeholder="Teléfono" required />
            </div>
            <div className="container-input">
              <input type="email" name="correo" placeholder="Correo" required />
            </div>
            <div className="container-input">
              <input type="password" name="password" placeholder="Contraseña" required />
            </div>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "Registrarse"}
            </button>
          </form>
        </div>

        <div className="container-welcome">
          <div className="welcome-sign-up welcome">
            <h3>¡Bienvenido!</h3>
            <img className="saludo-welcome" src={bienvenida} alt="Bienvenida" />
            <p>Es un placer tenerte de regreso. Tu tienda favorita te estaba esperando. Ingresa y continúa donde lo dejaste.</p>
            <button className="button" onClick={handleSignUpClick}>Registrarse</button>
          </div>
          <div className="welcome-sign-in welcome">
            <h3>¡Hola!</h3>
            <img className="saludo-welcome" src={saludo} alt="Saludo" />
            <p>Nos alegra tenerte aquí. Crea tu cuenta y descubre todo lo que hemos preparado para ti</p>
            <button className="button" onClick={handleSignInClick}>Iniciar Sesión</button>
          </div>
        </div>
      </div>
    </div>
  );
}
