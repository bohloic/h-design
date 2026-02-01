import React from 'react';
import { User, Package, Heart, Settings, CreditCard, ChevronRight, Gift, X } from 'lucide-react';
import LogoutButton from '../../src/components/logoutButton.jsx';

interface DashboardSidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // NOUVEAU : Props pour gérer l'ouverture mobile
  isOpen: boolean; 
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ user, activeTab, setActiveTab, isOpen, onClose }) => {
  
  const MENU_ITEMS = [
    { id: 'orders', label: 'Commandes', icon: Package },
    { id: 'wishlist', label: 'Envies', icon: Heart },
    { id: 'payments', label: 'Paiement', icon: CreditCard },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  // Cette fonction gère le clic : on change l'onglet ET on ferme le menu mobile
  const handleItemClick = (id: string) => {
    setActiveTab(id);
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
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-50 overflow-y-auto transition-transform duration-300 ease-in-out p-4
        lg:translate-x-0 lg:static lg:w-72 lg:bg-transparent lg:p-0 lg:overflow-visible
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* BOUTON FERMER (Mobile seulement) */}
        <div className="flex justify-end mb-4 lg:hidden">
            <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm text-slate-500">
                <X size={24} />
            </button>
        </div>

        <div className="space-y-4 lg:space-y-6">
            {/* CARTE PROFIL */}
            <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-16 bg-red-50"></div>
                
                <div className="relative z-10 w-20 h-20 lg:w-24 lg:h-24 bg-red-100 rounded-full flex items-center justify-center mb-3 text-red-600 border-4 border-white shadow-lg">
                <User size={40} className="lg:w-12 lg:h-12" />
                </div>
                
                <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                    {user?.nom ? `${user.nom} ${user.prenom}` : "Mon Compte"}
                </h2>
                <p className="text-slate-500 text-xs lg:text-sm mb-4 truncate w-full px-2">
                    {user?.email || "..."}
                </p>
                
                <div className="w-full bg-slate-50 rounded-2xl p-3 lg:p-4 flex justify-between items-center border border-slate-100">
                <div className="text-left">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fidélité</p>
                    <p className="text-base lg:text-lg font-black text-red-600">
                        {user?.loyalty_points || 0} pts
                    </p>
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm">
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
                    <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        isActive 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-200 font-bold' 
                        : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50' 
                    }`}
                    >
                    <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-base">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
                    </button>
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