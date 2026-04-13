import React, { useEffect, useState } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from '../../types.js';
import DashboardSidebar from './DashboardSidebar'; 
import { Menu, User } from 'lucide-react'; 
import { Outlet, useLocation } from 'react-router-dom';
import { useAutoRefresh } from '../../src/utils/hooks/useAutoRefresh';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import { translateStatus } from '../../src/utils/statusTranslations';



interface DashboardProps {
  onAddToCart?: (p: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onAddToCart }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'orders';
  
  // État pour ouvrir/fermer le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<any>({});
  const [order, setOrder] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  // 🪄 Références pour détecter les changements en temps réel
  const prevUserRef = React.useRef<any>(null);
  const prevOrdersRef = React.useRef<any[]>(null);

  const getUserData = async (showLoader = true) => {
    if (!token) return;
    try {
      if (showLoader) setLoading(true);
      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.userId;

      const [responseUser, responseOrder] = await Promise.all([
         authFetch(`/api/users/${userId}`),
         authFetch(`/api/orders/my-orders/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
         })
      ]);

      const newUser = responseUser.ok ? await responseUser.json() : {};
      const newOrders = responseOrder.ok ? await responseOrder.json() : [];

      // On garde les références à jour but on ne génère plus de notifications locales ici
      // car le backend s'en occupe maintenant pour tout l'écosystème.
      prevUserRef.current = newUser;
      prevOrdersRef.current = newOrders;

      setUser(newUser);
      setOrder(newOrders);

    } catch(error){
      console.error("Erreur Dashboard:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    getUserData(true);
  }, [token]);

  useAutoRefresh(() => getUserData(false), 10000);

  // L'état 'order' devrait finalement être géré par Context ou passé via Outlet context,
  // mais pour limiter l'impact de ce refactoring, les pages doivent idéalement récupérer leurs infos d'orders.
  // Puisque Commande s'attend à recevoir 'orders', utilisons Outlet's context prop.

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-12 bg-slate-50 dark:bg-carbon min-h-screen transition-colors">
      
      {/* --- HEADER MOBILE (Visible uniquement sur mobile) --- */}
      <div className="lg:hidden flex items-center justify-between mb-6 bg-white dark:bg-[#1A1A1C] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 transition-colors">
        <div className="flex items-center gap-3">
             {/* Petit Avatar - 🪄 COULEURS DYNAMIQUES ICI */}
             <div 
                className="w-10 h-10 rounded-full flex items-center justify-center border border-white/5"
                style={{ 
                    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', 
                    color: 'var(--theme-primary)' 
                }}
             >
                <User size={20} />
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Bonjour,</p>
                 <p className="font-bold text-slate-900 dark:text-pure leading-none transition-colors">{user.prenom || 'Client'}</p>
             </div>
        </div>
        
        {/* BOUTON MENU */}
        <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
            <Menu size={24} />
        </button>
      </div>


      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        
        {/* SIDEBAR */}
        <DashboardSidebar 
            user={user} 
            activeTab={currentPath}
            // On passe les props d'ouverture
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 min-w-0 pb-12"> 
            {/* Titre de la section active (Optionnel mais sympa sur mobile) */}
            <h1 className="text-3xl font-black mb-6 capitalize lg:hidden text-slate-900 dark:text-pure transition-colors">
                {currentPath === 'overview' ? 'Aperçu' :
                 currentPath === 'orders' ? 'Mes Commandes' :
                 currentPath === 'loyalty' ? 'Club VIP' : currentPath}
            </h1>
            
            {loading ? (
                <p className="p-8 text-center text-slate-400">Chargement...</p>
            ) : (
                <Outlet context={{ user, orders: order, onAddToCart }} />
            )}
        </main>
        
      </div>
    </div>
  );
};

export default Dashboard;