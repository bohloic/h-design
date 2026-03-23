// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated?: boolean; // Le ? rend la prop optionnelle si besoin
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated }) => {
  // Si isAuthenticated n'est pas passé, on peut vérifier le localStorage directement par sécurité
  const isAuth = isAuthenticated !== undefined ? isAuthenticated : !!localStorage.getItem('token');

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;