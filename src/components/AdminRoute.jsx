// import React from 'react';
// import { Navigate, Outlet } from 'react-router-dom';

// const AdminRoute = () => {
//     const token = localStorage.getItem('token');

//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }

//   try {
//     // On décode le token pour lire le rôle
//     const decoded = jwtDecode(token);
    
//     // Vérifie si le rôle est bien admin
//     if (decoded.role !== 'admin') {
//       return <Navigate to="/" replace />; // Redirection si pas admin
//     }

//     return <Outlet />; // C'est bon, on affiche la page admin

//   } catch (error) {
//     // Si le token est invalide
//     localStorage.removeItem('token');
//     return <Navigate to="/login" replace />;
//   }
// };

// export default AdminRoute;



import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const role = localStorage.getItem('role'); // Ou via décodage token

    // ✅ CORRECT : On retourne un composant <Navigate />
    if (role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;