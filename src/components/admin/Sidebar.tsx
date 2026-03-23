import { 
  ChevronRight, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Layers, // Pour Collection
  Tag,    // Pour Categorie
  Truck,   // Pour Livraison
  ScanBarcode,
  Palette
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import LogoutButton from "../tools/logoutButton";

export const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Tableau de bord', path: '/admin', icon: LayoutDashboard },
    { name: 'Produit', path: '/admin/products', icon: Package },
    { name: 'Commande', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Validations Design', path: '/admin/validations', icon: Palette },
    { name: 'Fidélité & Scan', path: '/admin/vip-scanner', icon: ScanBarcode },
    { name: 'Utilisateur', path: '/admin/customers', icon: Users },
    
    // --- ICONES MISES À JOUR ICI ---
    { name: 'Collection', path: '/admin/collections', icon: Layers },
    { name: 'Categorie', path: '/admin/categories', icon: Tag },
    { name: 'Livraison', path: '/admin/deliveries', icon: Truck },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          {/* 🪄 LOGO DYNAMIQUE */}
          <ShoppingBag style={{ color: 'var(--theme-primary)' }} /> H-Design
        </h1>
      </div>
      
      <nav className="mt-6 flex-1 px-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              // 🪄 ONGLET ACTIF DYNAMIQUE (Fond + Ombre)
              style={isActive ? { 
                  backgroundColor: 'var(--theme-primary)',
                  boxShadow: '0 10px 15px -3px color-mix(in srgb, var(--theme-primary) 40%, transparent)'
              } : {}}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive 
                    ? 'text-white font-bold' 
                    : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <LogoutButton />
        
        {/* J'ai ajouté une marge top (mt-4) pour séparer le bouton logout de la card pro */}
        <div className="bg-slate-800 rounded-xl p-4 mt-4">
          <p className="text-xs text-slate-400 mb-2">Version Pro</p>
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-semibold">Support 24/7</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};