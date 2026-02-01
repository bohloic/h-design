import React, { useState } from 'react';
import { ShoppingCart, User, Gift, Search, Menu, X, ShieldCheck, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  // On ajoute ces props pour que la Navbar soit réactive à l'état de App.tsx
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fonction utilitaire pour savoir si un lien est actif
  const isActive = (path: string) => location.pathname === path;
  
  // Récupération du rôle (sécurité visuelle uniquement, la vraie sécu est dans le backend/routes)
  const role = localStorage.getItem('role');

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-red-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. LOGO */}
          <Link to="/" className="flex items-center space-x-2 group" onClick={closeMenu}>
            <span className="christmas-font text-2xl md:text-3xl font-bold text-red-600 group-hover:scale-105 transition-transform">
              H-design
            </span>
            <Gift className="text-green-600 w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>

          {/* 2. MENU DESKTOP (Caché sur mobile) */}
          <div className="hidden md:flex items-center space-x-8 font-medium">
            <Link to="/" className={`${isActive('/') ? 'text-red-600 font-bold' : 'text-slate-600 hover:text-red-600'} transition-colors`}>
              Accueil
            </Link>
            <Link to="/boutique" className={`${isActive('/boutique') ? 'text-red-600 font-bold' : 'text-slate-600 hover:text-red-600'} transition-colors`}>
              Boutique
            </Link>
            
            {isAuthenticated ? (
               <Link to="/dashboard" className={`${isActive('/dashboard') ? 'text-red-600 font-bold' : 'text-slate-600 hover:text-red-600'} transition-colors`}>
                 Mon Compte
               </Link>
            ) : (
               <Link to="/login" className="text-slate-600 hover:text-red-600 transition-colors">
                 Connexion
               </Link>
            )}

            {/* LIEN ADMIN (Visible uniquement pour admin) */}
            {isAuthenticated && role === 'admin' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-100 hover:bg-red-100 transition-all"
              >
                <ShieldCheck size={16} /> Admin
              </Link>
            )}
          </div>

          {/* 3. ICONES ACTIONS (Recherche, Panier, Burger Mobile) */}
          <div className="flex items-center space-x-2 md:space-x-4">
            
            {/* Recherche (Caché sur très petit mobile pour gagner place) */}
            <button className="hidden sm:block p-2 text-slate-600 hover:bg-red-50 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Compte (Desktop seulement, sur mobile c'est dans le menu) */}
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="hidden md:block p-2 text-slate-600 hover:bg-red-50 rounded-full transition-colors">
              <User className="w-5 h-5" />
            </Link>

            {/* Panier */}
            <button 
              onClick={onOpenCart}
              className="p-2 text-slate-600 hover:bg-red-50 rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* BOUTON MENU MOBILE (Burger) */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MENU MOBILE DÉROULANT (Visible quand isMenuOpen est true) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-2">
            
            <Link 
              to="/" 
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/') ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Accueil
            </Link>
            
            <Link 
              to="/boutique" 
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/boutique') ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Boutique
            </Link>

            {/* ADMIN LINK MOBILE */}
            {isAuthenticated && role === 'admin' && (
               <Link 
                 to="/admin" 
                 onClick={closeMenu}
                 className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-bold text-red-600 bg-red-50 border border-red-100"
               >
                 <ShieldCheck size={18} /> Administration
               </Link>
            )}

            <div className="border-t border-slate-100 my-2 pt-2">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={closeMenu}
                    className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <User className="w-5 h-5 mr-3" /> Mon Compte
                  </Link>
                  <button 
                    onClick={() => { onLogout(); closeMenu(); navigate('/'); }}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Se déconnecter
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  onClick={closeMenu}
                  className="flex items-center justify-center w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-bold mt-4"
                >
                  Se connecter / S'inscrire
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;