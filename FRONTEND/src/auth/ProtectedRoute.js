import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, obtenerRol } from '../auth/authService';

const ProtectedRoute = ({ children, role }) => {
  const isAuth = isAuthenticated();
  const userRole = obtenerRol();

  if (!isAuth) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/no-autorizado" />;

  return children;
};

export default ProtectedRoute;
