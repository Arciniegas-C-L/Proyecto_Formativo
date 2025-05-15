import React, { useRef, useState } from 'react';
import saludo from "../assets/images/saludo.webp"
import bienvenida from "../assets/images/bienvenida.gif"
import "../assets/css/sesion.css";
import { loginUsuario, registerUsuario } from '../api/Usiario.api';

export function Sesion() {
  const containerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignInClick = () => {
    containerRef.current.classList.remove('toggle');
  };

  const handleSignUpClick = () => {
    containerRef.current.classList.add('toggle');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      const response = await loginUsuario({
        correo: email,
        contrasena: password,
      });
      alert("Inicio de sesión exitoso");
      console.log(response.data);
    } catch (error) {
      alert("Error: " + (error.response?.data?.non_field_errors || "Credenciales inválidas"));
    }

    setIsSubmitting(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const nombre = e.target[0].value;
    const apellido = e.target[1].value;
    const telefono = e.target[2].value;
    const email = e.target[3].value;
    const password = e.target[4].value;

  try {
    await registerUsuario({
      nombre,
      apellido,
      correo: email,
      contrasena: password,
      telefono, 
    });

      alert("Registro exitoso");
    } catch (error) {
      alert("Error: " + JSON.stringify(error.response?.data || {}));
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
            <a href="#">¿Olvidaste tu contraseña?</a>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "INICIAR SESIÓN"}
            </button>
          </form>
        </div>

        <div className="container-form">
          <form className="sign-up" onSubmit={handleRegister}>
            <h2>Registrarse</h2>
            <span>Use su correo electrónico para registrarse</span>
            <div className="container-input">
              <input type="text" placeholder="Nombre" required />
            </div>
            <div className="container-input">
              <input type="text" placeholder="Apellido" required />
            </div>
            <div className="container-input">
              <input type="tel" placeholder="Teléfono" required />
            </div>
            <div className="container-input">
              <input type="email" placeholder="Correo" required />
            </div>
            <div className="container-input">
              <input type="password" placeholder="Contraseña" required />
            </div>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "REGISTRARSE"}
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
};

