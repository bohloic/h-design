
import React from 'react';
import { ShoppingCart, User, Gift, Home, Search, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
// import { useConnect } from '../utils/hooks';

// Si vous utilisez TypeScript, mettez à jour l'interface :
interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const isConnect =  localStorage.token ? true : false
  // const {isConnect, setIsConnect} = useState()
  // console.log(isConnect)
  

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-red-100 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="christmas-font text-3xl font-bold text-red-600">Festiv'Élégance</span>
          <Gift className="text-green-600 w-6 h-6" />
        </Link>

        <div className="hidden md:flex space-x-8 font-medium">
          <Link to="/" className={`${isActive('/') ? 'text-red-600' : 'text-slate-600 hover:text-red-600'} transition-colors`}>Accueil</Link>
          <Link to="/boutique" className={`${isActive('/boutique') ? 'text-red-600' : 'text-slate-600 hover:text-red-600'} transition-colors`}>Boutique</Link>
          {isConnect ? (
            <Link to="/dashboard" className={`${isActive('/dashboard') ? 'text-red-600' : 'text-slate-600 hover:text-red-600'} transition-colors`}>Mon Compte</Link>
          ) : (
            <Link to="/login" className={`${isActive('/login') ? 'text-red-600' : 'text-slate-600 hover:text-red-600'} transition-colors`}>Connexion/inscription</Link>
          )}
          
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-600 hover:bg-red-50 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="p-2 text-slate-600 hover:bg-red-50 rounded-full transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <button 
            onClick={onOpenCart}
            className="p-2 text-slate-600 hover:bg-red-50 rounded-full transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
