import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PrivateRoute = () => {
    const location = useLocation();
    // 1. On vérifie si le token existe dans le localStorage
    const auth = localStorage.getItem('token'); 
    

    // 2. LA LOGIQUE DU VIDEUR :
    // Si auth existe (true) -> On retourne <Outlet /> (qui représente la page que l'utilisateur voulait voir)
    // Sinon -> On retourne <Navigate /> qui redirige vers la page de connexion avec l'état de provenance
    return auth ? <Outlet /> : <Navigate to="/login" state={{ from: location }} />;
}

export default PrivateRoute;