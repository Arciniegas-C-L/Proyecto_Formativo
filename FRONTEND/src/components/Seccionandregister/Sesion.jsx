import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import saludo from "../../assets/images/saludo.webp";
import bienvenida from "../../assets/images/bienvenida.gif";
import "../../assets/css/sesion.css";
import { loginUsuario, registerUsuario } from '../../api/Usuario.api';
import toast from 'react-hot-toast';

export function Sesion() {
 // Hook para hacer referencia al contenedor principal (usado para cambiar clases CSS dinámicamente)
const containerRef = useRef(null);

// Estado para controlar si se está enviando un formulario (login o registro)
const [isSubmitting, setIsSubmitting] = useState(false);

// Hook de React Router para redireccionar
const navigate = useNavigate();

// Muestra el formulario de inicio de sesión (quita la clase 'toggle')
const handleSignInClick = () => {
  containerRef.current.classList.remove('toggle');
};

// Muestra el formulario de registro (agrega la clase 'toggle')
const handleSignUpClick = () => {
  containerRef.current.classList.add('toggle');
};

// Función que maneja el inicio de sesión
const handleLogin = async (e) => {
  e.preventDefault(); // Evita el comportamiento por defecto del formulario
  setIsSubmitting(true); // Indica que se está procesando el envío

  // Obtiene los valores del formulario
  const form = e.target.elements;
  const correo = form.email.value;
  const password = form.password.value;

  try {
    // Llama a la API para iniciar sesión
    const response = await loginUsuario({ correo, password });

    // Guarda el token en localStorage
    localStorage.setItem('token', response.data.token);

    // Notifica éxito y redirige a la página principal
    toast.success("Inicio de sesión exitoso");
    navigate('/');
  } catch (error) {
    // Muestra error si las credenciales son inválidas u otro fallo
    const errorMsg = error.response?.data?.error || "Credenciales inválidas";
    toast.error("Error: " + errorMsg);
  }

  setIsSubmitting(false); // Finaliza el estado de envío
};

// Función que maneja el registro de usuario
const handleRegister = async (e) => {
  e.preventDefault(); // Previene el comportamiento por defecto del formulario
  setIsSubmitting(true); // Inicia el estado de envío

  // Obtiene los valores del formulario de registro
  const form = e.target.elements;
  const nombre = form.nombre.value;
  const apellido = form.apellido.value;
  const telefono = form.telefono.value;
  const correo = form.correo.value;
  const password = form.password.value;

  try {
    // Llama a la API para registrar un nuevo usuario
    await registerUsuario({
      nombre,
      apellido,
      correo,
      password,
      telefono,
    });

    // Notifica éxito y cambia al formulario de login
    toast.success("Registro exitoso. Ahora inicia sesión.");
    containerRef.current.classList.remove('toggle');
  } catch (error) {
    // Muestra mensaje de error
    toast.error("Error: " + JSON.stringify(error.response?.data || {}));
  }

  setIsSubmitting(false); // Finaliza el estado de envío
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
              {isSubmitting ? "Procesando..." : "INICIAR SESIÓN"}
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
}
