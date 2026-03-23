import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    // 1. Si l'utilisateur n'est pas connecté (pas de token ou pas de rôle)
    if (!token || !role) {
        return <Navigate to="/login" replace />;
    }

    // 2. Si l'utilisateur est connecté mais n'est PAS un admin
    if (role !== 'admin') {
        // Optionnel : tu pourrais afficher une alerte "Accès refusé" avant de rediriger
        return <Navigate to="/" replace />;
    }

    // 3. Tout est OK, on affiche les routes enfants de l'administration
    return <Outlet />;
};

export default AdminRoute;