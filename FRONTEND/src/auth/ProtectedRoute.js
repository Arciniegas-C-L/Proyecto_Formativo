import { Navigate } from 'react-router-dom';
import { isAuthenticated, obtenerRol } from './authService';

export default function ProtectedRoute({ children, role }) {
  if (!isAuthenticated()) {
    return <Navigate to="/sesion" />;
  }

  if (role && obtenerRol() !== role) {
    return <Navigate to="/no-autorizado" />;
  }

  return children;
}
