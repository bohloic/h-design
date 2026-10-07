import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../utils/context/AuthContext';
import LoadingSpinner from '../tools/LoadingSpinner';

const AdminRoute: React.FC = () => {
    const { isAuthenticated, user, loading } = useAuth();

    // 1. En cours de chargement
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
                <LoadingSpinner size={100} />
                <span className="text-slate-500 font-semibold text-sm">Vérification des accès...</span>
            </div>
        );
    }

    // 2. Si l'utilisateur n'est pas connecté ou n'est pas admin
    const role = user?.role || localStorage.getItem('role');
    
    if (!isAuthenticated || role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    // 3. Tout est OK, on affiche les routes enfants de l'administration
    return <Outlet />;
};

export default AdminRoute;
