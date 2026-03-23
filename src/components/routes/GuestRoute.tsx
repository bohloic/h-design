import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const GuestRoute: React.FC = () => {
  // 1. On vérifie juste la présence du token
  const token = localStorage.getItem('token');
  
  // 2. Si le token est là, on force la direction vers le Dashboard.
  // On arrête d'utiliser location.state pour l'instant pour casser la boucle.
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Sinon, on laisse l'utilisateur voir Login/Register
  return <Outlet />;
};

export default GuestRoute;