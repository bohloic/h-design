import React from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../../utils/hooks/useLogout';

interface LogoutButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Bouton de déconnexion.
 * Utilise le hook `useLogout` qui gère le nettoyage complet et
 * redirige vers `/login` avec rechargement complet.
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({ className = '', style = {} }) => {
  const logout = useLogout();

  return (
    <button
      onClick={logout}
      className={`flex items-center gap-2 text-red-600 bg-white border px-4 py-2.5 rounded-xl transition-all font-bold active:scale-95 group shadow-sm hover:shadow-md theme-logout-btn ${className}`}
      style={style}
    >
      <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
      <span>Se déconnecter</span>
    </button>
  );
};

export default LogoutButton;
