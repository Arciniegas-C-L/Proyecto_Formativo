import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import saludo from '../../assets/images/saludo.webp';
import bienvenida from '../../assets/images/bienvenida.gif';
import '../../assets/css/Seccionandregistrer/sesion.css';
import { useAuth } from '../../context/AuthContext';
import { loginUsuario, registerUsuario } from '../../api/Usuario.api';
import toast from 'react-hot-toast';
import "bootstrap-icons/font/bootstrap-icons.css"; 

export function Sesion() {
  const { login } = useAuth();
  const containerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false); //  toggle login
  const [showPasswordRegister, setShowPasswordRegister] = useState(false); //  toggle registro
  const navigate = useNavigate();

  const handleSignInClick = () => containerRef.current?.classList.remove('toggle');
  const handleSignUpClick = () => containerRef.current?.classList.add('toggle');

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

      if (data?.rol === 'administrador') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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
      const backend = error?.response?.data;
      const status = error?.response?.status;
      const errorMsg =
        backend?.mensaje ||
        backend?.error ||
        (status === 400 && 'Datos inválidos') ||
        (status === 401 && 'No autorizado') ||
        (status === 500 && 'Error interno del servidor') ||
        error.message ||
        'No se pudo registrar el usuario';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-sesion">
      <div className="container" ref={containerRef}>
        {/* Formulario Iniciar Sesión */}
        <div className="container-form">
          <form className="sign-in" onSubmit={handleLogin}>
            <h2>Iniciar sesión</h2>
            <span>Use su correo y contraseña</span>
            <div className="container-input">
              <input type="email" name="correo" placeholder="Correo" required />
            </div>
            <div className="container-input" style={{ position: "relative" }}>
              <input
                type={showPasswordLogin ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                required
              />
              <i
                className={`bi ${showPasswordLogin ? "bi-eye-slash" : "bi-eye"}`}
                onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#bbb",
                  fontSize: "1rem"
                }}
              ></i>
            </div>
            <Link to="/sesion/recuperar_contrasena" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Formulario Registro */}
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
            <div className="container-input" style={{ position: "relative" }}>
              <input
                type={showPasswordRegister ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                required
              />
              <i
                className={`bi ${showPasswordRegister ? "bi-eye-slash" : "bi-eye"}`}
                onClick={() => setShowPasswordRegister(!showPasswordRegister)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#bbb",
                  fontSize: "1rem"
                }}
              ></i>
            </div>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Registrarse'}
            </button>
          </form>
        </div>

        {/* Panel de bienvenida animado */}
        <div className="container-welcome">
          <div className="welcome-sign-up welcome">
            <h3>¡Bienvenido!</h3>
            <img className="saludo-welcome" src={bienvenida} alt="Bienvenida" />
            <p>
              Es un placer tenerte de regreso. Tu tienda favorita te estaba esperando. Ingresa y continúa donde lo
              dejaste.
            </p>
            <button className="button" onClick={handleSignUpClick}>
              Registrarse
            </button>
          </div>
          <div className="welcome-sign-in welcome">
            <h3>¡Hola!</h3>
            <img className="saludo-welcome" src={saludo} alt="Saludo" />
            <p>
              Nos alegra tenerte aquí. Crea tu cuenta y descubre todo lo que hemos preparado para ti
            </p>
            <button className="button" onClick={handleSignInClick}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}