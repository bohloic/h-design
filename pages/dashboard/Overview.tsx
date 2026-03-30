import React from 'react';
import { Package, Heart, CreditCard, ArrowRight, User, Award } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { formatCurrency } from "@/constants";
import { useWishlistStore } from '@/src/store/useWishlistStore';
import { translateStatus } from '@/src/utils/statusTranslations';

export const Overview: React.FC = () => {
  const { user, orders } = useOutletContext<{ user: any, orders: any[] }>();

  const recentOrders = orders?.slice(0, 3) || [];
  const wishlistItems = useWishlistStore(state => state.items);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      
      {/* MESSAGE D'ACCUEIL */}
      <div className="bg-white dark:bg-[#1A1A1C] p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="hidden md:block text-2xl lg:text-3xl font-black text-slate-900 dark:text-pure tracking-tight">
            Bonjour, {user?.prenom || 'Client'} ! 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Bienvenue sur votre espace personnalisé H-Designer.</p>
        </div>
        <Link 
          to="/boutique" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          Découvrir les nouveautés
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* CARTES RÉSUMÉ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Link to="/dashboard/orders" className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Commandes</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-pure transition-colors">{orders?.length || 0}</h3>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </Link>

        <Link to="/dashboard/loyalty" className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 hover:border-amber-200 dark:hover:border-amber-500/50 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Points VIP</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-pure transition-colors">{user?.loyalty_points || 0}</h3>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>
        
        <Link to="/dashboard/wishlist" className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/50 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Heart size={24} />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Envies</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-pure transition-colors">{wishlistItems.length}</h3>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
          </div>
        </Link>

        <Link to="/dashboard/settings" className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <User size={24} />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Profil</p>
          <div className="flex items-end justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-pure truncate pr-2 transition-colors">{user?.email || 'Gérer'}</h3>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* DERNIÈRES COMMANDES */}
      <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden transition-colors">
        <div className="p-6 lg:p-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-pure transition-colors">Activité récente</h3>
          <Link to="/dashboard/orders" className="text-sm font-bold text-indigo-600 hover:underline">
            Voir tout
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
              <Package size={28} />
            </div>
            <p className="text-slate-500 font-medium">Vous n'avez pas encore passé de commande.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentOrders.map((ord: any) => (
              <div key={ord.id} className="p-4 lg:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hidden sm:flex">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-pure transition-colors">Commande #HD-{String(ord.id).padStart(5, '0')}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(ord.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black" style={{ color: 'var(--theme-primary)' }}>{formatCurrency(ord.total_amount)}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{translateStatus(ord.status)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Overview;
