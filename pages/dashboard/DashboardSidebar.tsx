import React from 'react';
import { User, Package, Heart, Settings, CreditCard, ChevronRight, Gift, X, Award, LayoutDashboard } from 'lucide-react';
import LogoutButton from '../../src/components/tools/logoutButton.jsx';
import { LoyaltyCard } from '@/src/components/dashboard/LoyaltyCard.js';
import { Link } from 'react-router-dom';

interface DashboardSidebarProps {
  user: any;
  activeTab: string;
  // NOUVEAU : Props pour gérer l'ouverture mobile
  isOpen: boolean; 
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ user, activeTab, isOpen, onClose }) => {
  
  const MENU_ITEMS = [
    { id: 'overview', label: 'Aperçu', icon: LayoutDashboard },
    { id: 'orders', label: 'Commandes', icon: Package },
    { id: 'loyalty', label: 'Club VIP', icon: Award },
    { id: 'wishlist', label: 'Envies', icon: Heart },
    { id: 'payments', label: 'Paiement', icon: CreditCard },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  // Cette fonction gère le clic sur mobile pour fermer le menu
  const handleItemClick = () => {
    onClose(); // Ferme le menu après le clic
  };

  return (
    <>
      {/* 1. OVERLAY (FOND NOIR) - Visible uniquement sur mobile quand isOpen est true */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={onClose} // Ferme quand on clique à côté
        />
      )}

      {/* 2. LA SIDEBAR ELLE-MÊME */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-50 dark:bg-[#151515] h-[100dvh] overflow-y-auto transition-transform duration-300 ease-in-out p-4
        lg:translate-x-0 lg:relative lg:top-0 lg:z-0 lg:h-auto lg:w-72 lg:bg-transparent dark:lg:bg-transparent lg:p-0 lg:overflow-visible
        ${isOpen ? 'translate-x-0 shadow-2xl dark:shadow-black/50' : '-translate-x-full'}
      `}>
        
        {/* BOUTON FERMER (Mobile seulement) */}
        <div className="flex justify-end mb-4 lg:hidden">
            <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-500 dark:text-slate-400">
                <X size={24} />
            </button>
        </div>

        <div className="space-y-4 lg:space-y-6">
            {/* CARTE PROFIL */}
            <div className="bg-white dark:bg-[#1A1A1C] p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center text-center relative overflow-hidden transition-colors">
                {/* 🪄 BANDEAU DYNAMIQUE EN HAUT */}
                <div 
                    className="absolute top-0 w-full h-16"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}
                ></div>
                
                {/* 🪄 AVATAR DYNAMIQUE */}
                <div 
                    className="relative z-10 w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-white dark:border-[#1A1A1C] transition-colors"
                    style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                        color: 'var(--theme-primary)'
                    }}
                >
                <User size={40} className="lg:w-12 lg:h-12" />
                </div>
                
                <h2 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-pure transition-colors">
                    {user?.nom ? `${user.nom} ${user.prenom}` : "Mon Compte"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs lg:text-sm mb-4 truncate w-full px-2 transition-colors">
                    {user?.email || "..."}
                </p>
                
                <div className="w-full bg-slate-50 dark:bg-black/20 rounded-2xl p-3 lg:p-4 flex justify-between items-center border border-slate-100 dark:border-white/5 transition-colors">
                    <div className="text-left">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Fidélité</p>
                        {/* 🪄 TEXTE DYNAMIQUE (POINTS) */}
                        <p className="text-base lg:text-lg font-black" style={{ color: 'var(--theme-primary)' }}>
                            {user?.loyalty_points || 0} pts
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#2A2A2E] p-2 rounded-full shadow-sm">
                        <Gift className="text-amber-400 w-5 h-5 lg:w-6 lg:h-6" />
                    </div>                    
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex flex-col gap-2">
                {MENU_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                    <Link
                    to={`/dashboard/${item.id}`}
                    key={item.id}
                    onClick={handleItemClick}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                        isActive 
                        ? 'font-bold' 
                        : 'bg-white dark:bg-transparent text-slate-600 dark:text-slate-400 border-slate-100 dark:border-transparent hover:bg-slate-50 dark:hover:bg-white/5' 
                    }`}
                    // 🪄 BOUTON DYNAMIQUE (Actif)
                    style={isActive ? { 
                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                        color: 'var(--theme-primary)'
                    } : {}}
                    >
                    <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-base">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
                    </Link>
                );
                })}

                <div className="mt-2">
                    <LogoutButton />
                </div>
            </nav>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;