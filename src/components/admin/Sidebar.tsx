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
  X,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  Settings
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authFetch } from "@/utils/apiClient";
import { useAuth } from "@/utils/context/AuthContext";
import { useAutoRefresh } from "@/utils/hooks/useAutoRefresh";
import { ADMIN_BASE_PATH } from "@/constants";
import logoLight from "../../assets/logo.png";

export const Sidebar = ({ 
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: { 
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [badges, setBadges] = useState({ pendingDesigns: 0, pendingOrders: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchBadges = async () => {
    try {
      const response = await authFetch('/api/admin/badges');
      if (response && response.ok) {
        const data = await response.json();
        setBadges(data);
        return;
      }
      
      // Fallback local : calculer directement depuis les commandes si l'endpoint badges est indisponible
      const ordersRes = await authFetch('/api/admin/orders');
      if (ordersRes && ordersRes.ok) {
        const rawOrders = await ordersRes.json();
        const allOrders = (Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders || [])).map((order: any) => {
          let items = order.items;
          if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch(e) { items = []; }
          }
          return { ...order, items: Array.isArray(items) ? items : [] };
        });

        const pendingDesignsCount = allOrders.filter((order: any) => {
          const statusLower = String(order.status || '').toLowerCase().trim();
          const isValidationStatus = 
            statusLower === 'paid_waiting' || 
            statusLower === 'paid_waiting_validation' ||
            statusLower === 'waiting_validation' ||
            statusLower === 'pending_approval' ||
            statusLower.includes('validation') ||
            statusLower.includes('valider');

          const hasUnapprovedCustomItem = order.items?.some((item: any) => {
            let designData: any = null;
            try {
              if (item.customization) {
                designData = typeof item.customization === 'string' 
                  ? JSON.parse(item.customization) 
                  : item.customization;
              }
            } catch (e) {}
            
            const isCustom = !!(
              item.customization || 
              item.design || 
              item.customization_image ||
              designData?.customizationImage || 
              (designData?.elements && designData.elements.length > 0)
            );
            
            const itemStatusLower = String(item.design_status || '').toLowerCase().trim();
            const isApproved = ['validé', 'approved', 'valide'].includes(itemStatusLower);
            
            return isCustom && !isApproved;
          });

          return isValidationStatus || hasUnapprovedCustomItem;
        }).length;

        const pendingOrdersCount = allOrders.filter((order: any) => {
          const s = String(order.status || '').toLowerCase();
          return s === 'pending' || s.includes('attente de paiement');
        }).length;

        setBadges({ pendingDesigns: pendingDesignsCount, pendingOrders: pendingOrdersCount });
      }
    } catch (error) {
      console.error("Erreur fetch badges:", error);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  useAutoRefresh(fetchBadges, 30000);

  const menuItems = [
    { name: 'Tableau de bord', path: ADMIN_BASE_PATH, icon: LayoutDashboard, group: 'Analytique' },
    { name: 'Produits', path: `${ADMIN_BASE_PATH}/products`, icon: Package, group: 'Boutique' },
    { name: 'Commandes', path: `${ADMIN_BASE_PATH}/orders`, icon: ShoppingBag, group: 'Boutique', badge: badges.pendingOrders },
    { name: 'Validations Design', path: `${ADMIN_BASE_PATH}/validations`, icon: Palette, group: 'Boutique', badge: badges.pendingDesigns },
    { name: 'Clients', path: `${ADMIN_BASE_PATH}/customers`, icon: Users, group: 'CRM' },
    { name: 'Fidélité & Scan', path: `${ADMIN_BASE_PATH}/vip-scanner`, icon: ScanBarcode, group: 'CRM' },
    { name: 'Collections', path: `${ADMIN_BASE_PATH}/collections`, icon: Layers, group: 'Contenu' },
    { name: 'Catégories', path: `${ADMIN_BASE_PATH}/categories`, icon: Tag, group: 'Contenu' },
    { name: 'Livraisons', path: `${ADMIN_BASE_PATH}/deliveries`, icon: Truck, group: 'Logistique' },
  ];

  const groups: Record<string, typeof menuItems> = {};
  menuItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const adminData = (() => {
    try {
      const d = localStorage.getItem('data');
      return d ? JSON.parse(d) : {};
    } catch { return {}; }
  })();

  // Écouteur pour la touche Échap sur la modal profil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showProfileModal) {
        setShowProfileModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProfileModal]);

  return (
    <div className="w-full h-full bg-slate-900 text-slate-300 flex flex-col relative overflow-hidden select-none">
      
      {/* ── LOGO & RÉDUCTION SIDEBAR (STICKY TOP) ── */}
      <div className="px-3 py-4 border-b border-slate-800/60 flex-shrink-0 flex items-center justify-between bg-slate-900 sticky top-0 z-20">
        <Link to={ADMIN_BASE_PATH} className="flex items-center group overflow-hidden">
          <img 
            src={logoLight} 
            alt="H-Designer" 
            className="h-10 w-auto group-hover:scale-105 transition-transform object-contain flex-shrink-0" 
          />
        </Link>

        <div className="flex items-center gap-1">
          {/* 🪄 BOUTON RÉDUCTION DE LA BARRE LATÉRALE */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Déplier le menu" : "Réduire le menu"}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 shadow-sm"
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {!isCollapsed && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Réduire</span>}
            </button>
          )}

          {/* Bouton Fermer Mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
              title="Fermer le menu"
              aria-label="Fermer le menu"
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer relative z-50 touch-target-44 active:scale-95"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* LIEN DE RETOUR À LA BOUTIQUE */}
      <div className="px-3 py-3 border-b border-slate-800/60 flex-shrink-0">
        <Link
          to="/"
          title="Aller sur la boutique publique"
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Store size={16} className="text-theme-primary flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">Voir la boutique</span>
              <ExternalLink size={12} className="ml-auto opacity-50 flex-shrink-0" />
            </>
          )}
        </Link>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName}>
            {!isCollapsed && (
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">
                {groupName}
              </p>
            )}
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = location.pathname === item.path || 
                                 (item.path !== ADMIN_BASE_PATH && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      isActive 
                        ? 'text-white font-bold bg-theme-primary shadow-[0_4px_12px_rgba(var(--theme-primary-rgb),0.4)]' 
                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                    
                    {item.badge > 0 && (
                      <span className={`${isCollapsed ? 'absolute top-1 right-1' : 'ml-auto'} bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center shadow-lg border border-red-600 animate-in zoom-in duration-300`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}

                    {!isCollapsed && isActive && !item.badge && <ChevronRight size={14} className="ml-auto opacity-80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── PROFIL ADMIN + ACCÈS PARAMÈTRES ET DECONNEXION (STICKY BOTTOM) ── */}
      <div className="p-3 border-t border-slate-800/60 flex-shrink-0 bg-slate-900 sticky bottom-0 z-20">
        <div className={`bg-slate-800/60 rounded-2xl p-2.5 flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <button
            onClick={() => setShowProfileModal(true)}
            title="Ouvrir mon profil & paramètres"
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm bg-theme-primary/25 text-theme-primary hover:scale-105 transition-transform"
          >
            {adminData?.prenom ? adminData.prenom[0].toUpperCase() : 'A'}
          </button>
          
          {!isCollapsed && (
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setShowProfileModal(true)}>
              <p className="text-white text-sm font-bold truncate hover:underline">
                {adminData?.prenom ? `${adminData.prenom} ${adminData.nom || ''}` : 'Administrateur'}
              </p>
              <p className="text-slate-500 text-[10px] flex items-center gap-1">
                <ShieldCheck size={10} className="text-theme-primary" />
                Super Admin
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
              title="Paramètres du compte"
            >
              <Settings size={16} />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors flex-shrink-0"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── MODAL PROFIL & PARAMÈTRES DU COMPTE ── */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserCheck size={20} className="text-theme-primary" />
                Profil & Paramètres Admin
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                onTouchEnd={(e) => { e.preventDefault(); setShowProfileModal(false); }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer relative z-50 touch-target-44 active:scale-95"
                title="Fermer (Échap)"
                aria-label="Fermer la fenêtre du profil"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-theme-primary text-white flex items-center justify-center font-bold text-xl shadow-lg">
                  {adminData?.prenom ? adminData.prenom[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">
                    {adminData?.prenom ? `${adminData.prenom} ${adminData.nom || ''}` : 'Administrateur'}
                  </h4>
                  <p className="text-xs text-slate-500">{adminData?.email || 'admin@h-designer.com'}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-wider text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded-md">
                    <ShieldCheck size={12} /> Super Administrateur
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raccourcis rapides</p>
                <button
                  onClick={() => { setShowProfileModal(false); navigate('/dashboard/settings'); }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-700 text-sm border border-slate-200/80 transition-all group"
                >
                  <span className="flex items-center gap-3">
                    <Settings size={18} className="text-slate-500 group-hover:text-theme-primary transition-colors" />
                    Modifier mes paramètres de compte
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
                <button
                  onClick={() => { setShowProfileModal(false); navigate(`${ADMIN_BASE_PATH}/customers`); }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-700 text-sm border border-slate-200/80 transition-all group"
                >
                  <span className="flex items-center gap-3">
                    <Users size={18} className="text-slate-500 group-hover:text-theme-primary transition-colors" />
                    Gérer l'équipe & Utilisateurs
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-xl text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};