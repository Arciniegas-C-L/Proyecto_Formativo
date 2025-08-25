// src/components/auth/Sesion.jsx
import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import saludo from '../../assets/images/saludo.webp';
import bienvenida from '../../assets/images/bienvenida.gif';
import '../../assets/css/sesion.css';
import { useAuth } from '../../context/AuthContext';
import { loginUsuario, registerUsuario } from '../../api/Usuario.api';
import toast from 'react-hot-toast';

export function Sesion() {
  const { login } = useAuth();
  const containerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignInClick = () => containerRef.current?.classList.remove('toggle');
  const handleSignUpClick = () => containerRef.current?.classList.add('toggle');

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target.elements;
    const correo = form.correo.value;
    const password = form.password.value;

    try {
      const { data } = await loginUsuario({ correo, password });

      const access = data?.token?.access || data?.access;
      const refresh = data?.token?.refresh || data?.refresh;

      login({
        access,
        refresh,
        usuario: data?.usuario,
        rol: data?.rol,
      });

      toast.success(`Bienvenido ${data?.usuario?.nombre || ''}`.trim());

      if (data?.rol === 'administrador') navigate('/administrador');
      else navigate('/catalogo');
    } catch (error) {
      const backend = error?.response?.data;
      const errorMsg =
        backend?.detail ||
        backend?.non_field_errors?.[0] ||
        backend?.mensaje ||
        backend?.error ||
        'Credenciales inválidas';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // REGISTRO
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target.elements;
    const nombre = form.nombre.value;
    const apellido = form.apellido.value;
    const telefono = form.telefono.value;
    const correo = form.correo.value;
    const password = form.password.value.trim();

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    try {
      await registerUsuario({ nombre, apellido, correo, password, telefono });
      toast.success('Registro exitoso. Ahora inicia sesión.');
      containerRef.current?.classList.remove('toggle');
    } catch (error) {
      console.error("Error completo:", error);

      const backend = error?.response?.data;
      const status = error?.response?.status;

      const errorMsg =
        backend?.mensaje ||
        backend?.error ||
        (status === 400 && "Datos inválidos") ||
        (status === 401 && "No autorizado") ||
        (status === 500 && "Error interno del servidor") ||
        error.message ||
        "No se pudo registrar el usuario";

      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-sesion">
      <div className="container" ref={containerRef}>
        {/* LOGIN */}
        <div className="container-form">
          <form className="sign-in" onSubmit={handleLogin}>
            <h2>Iniciar Sesión</h2>
            <span>Use su correo y contraseña</span>
            <div className="container-input">
              <input type="email" name="correo" placeholder="Correo" required />
            </div>
            <div className="container-input">
              <input type="password" name="password" placeholder="Contraseña" required />
            </div>
            <Link to="/recuperar_contrasena" className="forgot-password">¿Olvidaste tu contraseña?</Link>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'INICIAR SESIÓN'}
            </button>
          </form>
        </div>

        {/* REGISTRO */}
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
              {isSubmitting ? 'Procesando...' : 'REGISTRARSE'}
            </button>
          </form>
        </div>

        {/* BIENVENIDA */}
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
