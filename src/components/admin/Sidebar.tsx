import { 
  ChevronRight, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Layers,
  Tag,
  Truck,
  ScanBarcode,
  Palette,
  LogOut,
  ShieldCheck,
  Store,
  ExternalLink,
  X 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoLight from "../../assets/Logo .png";
import logoDark from "../../assets/Logo2.png";

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Tableau de bord', path: '/admin', icon: LayoutDashboard, group: 'Analytique' },
    { name: 'Produits', path: '/admin/products', icon: Package, group: 'Boutique' },
    { name: 'Commandes', path: '/admin/orders', icon: ShoppingBag, group: 'Boutique' },
    { name: 'Validations Design', path: '/admin/validations', icon: Palette, group: 'Boutique' },
    { name: 'Clients', path: '/admin/customers', icon: Users, group: 'CRM' },
    { name: 'Fidélité & Scan', path: '/admin/vip-scanner', icon: ScanBarcode, group: 'CRM' },
    { name: 'Collections', path: '/admin/collections', icon: Layers, group: 'Contenu' },
    { name: 'Catégories', path: '/admin/categories', icon: Tag, group: 'Contenu' },
    { name: 'Livraisons', path: '/admin/deliveries', icon: Truck, group: 'Logistique' },
  ];

  const groups: Record<string, typeof menuItems> = {};
  menuItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    navigate('/login');
    window.location.href = '/login';
  };

  const adminData = (() => {
    try {
      const d = localStorage.getItem('data');
      return d ? JSON.parse(d) : {};
    } catch { return {}; }
  })();

  return (
    <div className="w-full h-full bg-slate-900 text-slate-300 flex flex-col overflow-y-auto">
      
      {/* ── LOGO ── */}
      <div className="px-4 py-5 border-b border-slate-800/60 flex-shrink-0 flex items-center justify-between">
        <Link to="/admin" className="flex items-center group -ml-2">
          <img src={logoLight} alt="H-Designer" className="h-16 w-auto group-hover:scale-105 transition-transform object-contain dark:hidden" />
          <img src={logoDark} alt="H-Designer" className="h-16 w-auto group-hover:scale-105 transition-transform object-contain hidden dark:block" />
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest -ml-4">Admin</p>
        </Link>

        {/* Bouton Fermer Mobile (Visible uniquement si onClose est fourni) */}
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <div className="px-4 pb-4 border-b border-slate-800/60 flex-shrink-0">
        {/* Lien vers la boutique */}
        <Link
          to="/"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium"
        >
          <Store size={15} style={{ color: 'var(--theme-primary)' }} />
          <span>Voir la boutique</span>
          <ExternalLink size={12} className="ml-auto opacity-50" />
        </Link>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName}>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-2">
              {groupName}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = location.pathname === item.path || 
                                 (item.path !== '/admin' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={isActive ? { 
                      backgroundColor: 'var(--theme-primary)',
                      boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-primary) 40%, transparent)'
                    } : {}}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive 
                        ? 'text-white font-bold' 
                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto opacity-80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── PROFIL ADMIN + LOGOUT ── */}
      <div className="p-3 border-t border-slate-800/60 flex-shrink-0">
        <div className="bg-slate-800/60 rounded-2xl p-3 flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)', color: 'var(--theme-primary)' }}
          >
            {adminData?.prenom ? adminData.prenom[0].toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-bold truncate">
              {adminData?.prenom ? `${adminData.prenom} ${adminData.nom || ''}` : 'Administrateur'}
            </p>
            <p className="text-slate-500 text-[10px] flex items-center gap-1">
              <ShieldCheck size={10} style={{ color: 'var(--theme-primary)' }} />
              Super Admin
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};