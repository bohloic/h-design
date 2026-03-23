import React from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../../utils/hooks/useLogout';

const LogoutButton = ({ className = "" }) => {
    const logout = useLogout();

    const deconnect = () => {
        // 🪄 On nettoie la session sans casser les préférences locales (panier, etc.)
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        
        // On déclenche la fonction de déconnexion (redirection, etc.)
        logout();   
    };

    return (
        <>
            <button 
                onClick={deconnect} 
                // On garde le rouge textuel pour la sécurité (action de sortie)
                // Mais on harmonise tout le reste avec le thème de la collection
                className={`flex items-center gap-2 text-red-600 bg-white border px-4 py-2.5 rounded-xl transition-all font-bold active:scale-95 group shadow-sm hover:shadow-md theme-logout-btn ${className}`}
                style={{ 
                    borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, #e2e8f0)' 
                }}
            >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                <span>Se déconnecter</span>
            </button>

            {/* 🪄 STYLES DYNAMIQUES POUR LE BOUTON DE SORTIE */}
            <style>{`
                .theme-logout-btn:hover {
                    background-color: color-mix(in srgb, var(--theme-primary) 5%, #fef2f2) !important;
                    border-color: var(--theme-primary) !important;
                    color: #dc2626; /* On force le maintien du rouge au hover */
                }
                .theme-logout-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 30%, transparent);
                }
            `}</style>
        </>
    );
};

export default LogoutButton;