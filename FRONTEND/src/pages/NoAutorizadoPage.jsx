import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/NoAutorizado/NoAutorizado.css';
import NoAutorizado from '../assets/images/NoAutorizado.gif'

export function NoAutorizadoPage() {
  const [count, setCount] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    if (count === 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, navigate]);

  const handleRedirect = () => navigate('/');

  return (
    <div className="no-autorizado-container">
      <img src={NoAutorizado} alt="Acceso Denegado" className="acceso-denegado-img"/>
      <h2>Acceso Denegado</h2>
      <p>No tienes los permisos necesarios para acceder a está página</p>
      <p className="no-autorizado-error">Error 403</p>
      <span 
        style={{ cursor: 'pointer', textDecoration: 'underline', color: '#d7263d', fontWeight: 500 }}
        title="Haz clic para ir al inicio"
        onClick={handleRedirect}
      >
        {`Serás redirigido en: ${count} segundo${count !== 1 ? 's' : ''}`}
      </span>
    </div>
  );
}
