import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RutaPrivada = ({ children, role }) => {
  const { autenticado, rol } = useAuth();

  if (!autenticado) {
    return <Navigate to="/sesion" />;
  }

  if (role) {
    const rolesPermitidos = Array.isArray(role) ? role : [role];
    if (!rolesPermitidos.includes(rol)) {
      return <Navigate to="/no-autorizado" />;
    }
  }

  return children;
};
