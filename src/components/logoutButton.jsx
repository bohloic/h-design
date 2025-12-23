import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // 1. SUPPRIMER LA PREUVE D'IDENTITÉ
        // On retire le token du stockage
        localStorage.removeItem('token');

        // (Optionnel) Si tu stockes aussi les infos utilisateur, supprime-les aussi
        localStorage.removeItem('userInfo'); 

        // 2. REDIRIGER L'UTILISATEUR
        // On le renvoie vers la page de login ou l'accueil
        navigate('/login'); 
        
        // (Optionnel) Recharger la page pour être sûr de vider tous les états en mémoire
        window.location.reload(); 
    };

    return (
        <button 
            onClick={()=> handleLogout()}
            style={{
                backgroundColor: '#ff4d4d', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                cursor: 'pointer'
            }}
        >
            Se déconnecter
        </button>
    );
};

export default LogoutButton;