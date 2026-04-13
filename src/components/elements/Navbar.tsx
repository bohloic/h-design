import React, { useState } from 'react';
import { ShoppingCart, User, Gift, Search, Menu, X, ShieldCheck, LogOut, Sun, Moon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NotificationDropdown } from './NotificationDropdown';
import { useTheme } from '../../utils/context/ThemeContext';
import logoLight from '../../assets/logo.png';
import logoDark from '../../assets/Logo2.png';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  user?: any;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart, isAuthenticated, onLogout, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { themeMode, toggleThemeMode } = useTheme();

  const isActive = (path: string) => location.pathname === path;
  const role = localStorage.getItem('role');
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 bg-offwhite/90 dark:bg-carbon/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-slate-900 dark:text-pure">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 1. LOGO DYNAMIQUE */}
          <Link to="/" className="flex items-center group" onClick={closeMenu}>
            <img 
              src={logoLight} 
              alt="H-Designer Logo" 
              className="h-16 w-auto group-hover:scale-105 transition-transform object-contain dark:hidden"
            />
            <img 
              src={logoDark} 
              alt="H-Designer Logo" 
              className="h-16 w-auto group-hover:scale-105 transition-transform object-contain hidden dark:block"
            />
          </Link>

          {/* 2. MENU DESKTOP */}
          <div className="hidden md:flex items-center space-x-8 font-bold">
            <Link 
              to="/" 
              style={isActive('/') ? { color: 'var(--theme-primary)' } : {}}
              className={`transition-colors ${isActive('/') ? '' : 'text-slate-600 dark:text-slate-300 hover-theme-text'}`}
            >
              Accueil
            </Link>
            <Link 
              to="/boutique" 
              style={isActive('/boutique') ? { color: 'var(--theme-primary)' } : {}}
              className={`transition-colors ${isActive('/boutique') ? '' : 'text-slate-600 dark:text-slate-300 hover-theme-text'}`}
            >
              Boutique
            </Link>
            <Link 
              to="/personnaliser/mon-design" 
              style={isActive('/personnaliser/mon-design') ? { color: 'var(--theme-primary)' } : {}}
              className={`transition-colors ${isActive('/personnaliser/mon-design') ? '' : 'text-slate-600 dark:text-slate-300 hover-theme-text'}`}
            >
              Personnalisation
            </Link>
            
            {isAuthenticated ? (
               <Link 
                to="/dashboard" 
                style={isActive('/dashboard') ? { color: 'var(--theme-primary)' } : {}}
                className={`transition-colors ${isActive('/dashboard') ? '' : 'text-slate-600 dark:text-slate-300 hover-theme-text'}`}
               >
                 Mon Compte
               </Link>
            ) : (
               <Link to="/login" className="text-slate-600 dark:text-slate-300 hover-theme-text transition-colors">
                 Connexion
               </Link>
            )}

            {/* LIEN ADMIN */}
            {isAuthenticated && role === 'admin' && (
              <Link 
                to="/admin" 
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                  color: 'var(--theme-primary)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black border hover:brightness-95 transition-all"
              >
                <ShieldCheck size={16} /> Admin
              </Link>
            )}
          </div>

          {/* 3. ICONES ACTIONS */}
          <div className="flex items-center space-x-1 md:space-x-3">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleThemeMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover-theme-bg-light rounded-full transition-colors hidden sm:block"
              title={themeMode === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>


            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:block text-xs font-black text-slate-400 uppercase tracking-tighter">
                  {user?.prenom || 'Compte'}
                </span>
                <NotificationDropdown />
              </div>
            ) : (
              <Link to="/login" className="hidden md:block p-2 text-slate-600 dark:text-slate-300 hover-theme-bg-light rounded-full transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Panier avec bulle dynamique et animée */}
            <button 
              onClick={onOpenCart}
              className="p-2 text-slate-600 dark:text-slate-300 hover-theme-bg-light rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span 
                  key={cartCount}
                  className="absolute -top-1 -right-1 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white cart-badge-pop"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Burger Mobile */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MENU MOBILE */}
      {isMenuOpen && (
        <div className="md:hidden bg-offwhite dark:bg-carbon border-t border-slate-200 dark:border-slate-800 absolute w-full shadow-xl animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-2">
            
            <Link 
              to="/" 
              onClick={closeMenu}
              style={isActive('/') ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' } : {}}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${isActive('/') ? '' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
            >
              Accueil
            </Link>
            
            <Link 
              to="/boutique" 
              onClick={closeMenu}
              style={isActive('/boutique') ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' } : {}}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${isActive('/boutique') ? '' : 'text-slate-600 dark:text-slate-300 hover-theme-bg-light'}`}
            >
              Boutique
            </Link>
            <Link 
              to="/personnaliser/mon-design" 
              onClick={closeMenu}
              style={isActive('/personnaliser/mon-design') ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' } : {}}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${isActive('/personnaliser/mon-design') ? '' : 'text-slate-600 dark:text-slate-300 hover-theme-bg-light'}`}
            >
              Personnalisation
            </Link>

            {isAuthenticated && role === 'admin' && (
               <Link 
                 to="/admin" 
                 onClick={closeMenu}
                 style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' }}
                 className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-black border border-transparent"
               >
                 <ShieldCheck size={18} /> Administration
               </Link>
            )}

            <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2">
              <button 
                onClick={() => { toggleThemeMode(); closeMenu(); }}
                className="w-full flex items-center px-4 py-3 rounded-xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                {themeMode === 'dark' ? <><Sun className="w-5 h-5 mr-3" /> Mode Clair</> : <><Moon className="w-5 h-5 mr-3" /> Mode Sombre</>}
              </button>
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={closeMenu}
                    className="flex items-center px-4 py-3 rounded-xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <User className="w-5 h-5 mr-3" /> {user?.prenom ? `Mon Compte (${user.prenom})` : 'Mon Compte'}
                  </Link>
                  <button 
                    onClick={() => { onLogout(); closeMenu(); navigate('/'); }}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Se déconnecter
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  onClick={closeMenu}
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                  className="flex items-center justify-center w-full text-white px-4 py-4 rounded-xl font-black mt-4 shadow-lg active:scale-95 transition-transform"
                >
                  Se connecter / S'inscrire
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🪄 STYLE MAGIQUE POUR LES ETATS HOVER */}
      <style>{`
        .hover-theme-text:hover {
            color: var(--theme-primary) !important;
        }
        .hover-theme-bg-light:hover {
            background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent) !important;
            color: var(--theme-primary) !important;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;