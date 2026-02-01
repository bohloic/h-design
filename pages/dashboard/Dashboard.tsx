import React, { useEffect, useState } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from '../../types.js';
import { Commande } from './Commande.js';
import DashboardSidebar from './DashboardSidebar'; 
import { Menu, User } from 'lucide-react'; // Import des icônes pour le header mobile

const Dashboard: React.FC = () => {
  const token = localStorage.getItem('token');
  
  const [activeTab, setActiveTab] = useState('orders');
  // NOUVEAU : État pour ouvrir/fermer le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<any>({});
  const [order, setOrder] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(token){
      const getUser = async () => {
        try {
          const decodedToken = jwtDecode<DecodedToken>(token);
          const userId = decodedToken.userId;

          const [responseUser, responseOrder] = await Promise.all([
             authFetch(`/api/users/${userId}`),
             authFetch(`/api/orders/my-orders/${userId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
             })
          ]);

          if (responseUser.ok) setUser(await responseUser.json());
          if (responseOrder.ok) setOrder(await responseOrder.json());

        } catch(error){
          console.error("Erreur Dashboard:", error);
        } finally {
            setLoading(false);
        }
      };
      getUser();
    }
  }, [token]);

  const renderContent = () => {
    if (loading) return <p className="p-8 text-center text-slate-400">Chargement...</p>;

    switch (activeTab) {
        case 'orders': return <Commande orders={order} />;
        case 'wishlist': return <div className="p-8 text-center bg-white rounded-3xl">Bientôt disponible</div>;
        case 'payments': return <div className="p-8 text-center bg-white rounded-3xl">Paiements</div>;
        case 'settings': return <div className="p-8 text-center bg-white rounded-3xl">Paramètres</div>;
        default: return <Commande orders={order} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-12 bg-slate-50 min-h-screen">
      
      {/* --- HEADER MOBILE (Visible uniquement sur mobile) --- */}
      <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
             {/* Petit Avatar */}
             <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <User size={20} />
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Bonjour,</p>
                 <p className="font-bold text-slate-900 leading-none">{user.prenom || 'Client'}</p>
             </div>
        </div>
        
        {/* BOUTON MENU */}
        <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
        >
            <Menu size={24} />
        </button>
      </div>


      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        
        {/* SIDEBAR (Maintenant capable de s'ouvrir en modal) */}
        <DashboardSidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            // On passe les props d'ouverture
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 min-w-0"> 
            {/* Titre de la section active (Optionnel mais sympa sur mobile) */}
            <h1 className="text-2xl font-bold mb-6 capitalize lg:hidden">
                {activeTab === 'orders' ? 'Mes Commandes' : activeTab}
            </h1>
            
            {renderContent()}
        </main>
        
      </div>
    </div>
  );
};

export default Dashboard;