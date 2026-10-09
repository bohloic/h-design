import React from 'react';
import { Home as HomeIcon, ShoppingBag, Palette, ShoppingCart, User, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/utils/context/AuthContext';
import { ADMIN_BASE_PATH } from '@/constants';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ cartCount, onOpenCart }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const role = user?.role || localStorage.getItem('role');

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[990] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-2.5 transition-colors">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">

        {/* 1. ACCUEIL */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/') && !location.pathname.startsWith('/boutique') && !location.pathname.startsWith('/personnaliser') && !location.pathname.startsWith('/dashboard')
              ? 'text-theme-primary font-bold scale-105' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HomeIcon size={20} />
          <span className="text-[10px] mt-1 font-medium">Accueil</span>
        </Link>

        {/* 2. BOUTIQUE */}
        <Link 
          to="/boutique" 
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/boutique') 
              ? 'text-theme-primary font-bold scale-105' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag size={20} />
          <span className="text-[10px] mt-1 font-medium">Boutique</span>
        </Link>

        {/* 3. PERSONNALISATION */}
        <Link 
          to="/personnaliser/mon-design" 
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/personnaliser/mon-design') 
              ? 'text-theme-primary font-bold scale-105' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="p-1.5 rounded-full bg-theme-primary/10 text-theme-primary">
            <Palette size={20} />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-theme-primary">Créer</span>
        </Link>

        {/* 4. PANIER */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 relative transition-all"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-theme-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-in zoom-in">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Panier</span>
        </button>

        {/* 5. COMPTE / ADMIN */}
        {isAuthenticated ? (
          role === 'admin' ? (
            <Link 
              to={ADMIN_BASE_PATH}
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                location.pathname.startsWith(ADMIN_BASE_PATH) 
                  ? 'text-theme-primary font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={20} className="text-theme-primary" />
              <span className="text-[10px] mt-1 font-bold text-theme-primary">Admin</span>
            </Link>
          ) : (
            <Link 
              to="/dashboard" 
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                isActive('/dashboard') 
                  ? 'text-theme-primary font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User size={20} />
              <span className="text-[10px] mt-1 font-medium">Compte</span>
            </Link>
          )
        ) : (
          <Link 
            to="/login" 
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              isActive('/login') 
                ? 'text-theme-primary font-bold scale-105' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User size={20} />
            <span className="text-[10px] mt-1 font-medium">Connexion</span>
          </Link>
        )}

      </div>
    </div>
  );
};

export default MobileBottomNav;
