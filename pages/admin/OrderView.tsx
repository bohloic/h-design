import React, { useState, useEffect } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { ShoppingBag, ChevronDown, Package, User, Calendar, CreditCard, Search, Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const statusTranslations: Record<string, string> = {
  'pending': 'En attente',
  'paid': 'Payé',
  'preparing': 'En préparation',
  'shipped': 'Expédié',
  'delivered': 'Livré',
  'cancelled': 'Annulé'
};

export const OrderView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await authFetch('/api/orders');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      
      if (!Array.isArray(data)) throw new Error("Format invalide");

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        customerName: order.nom ? `${order.nom} ${order.prenom}` : 'Client Inconnu',
        customerEmail: order.email || '—',
        date: order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : '—',
        total: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        status: order.status
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const oldOrders = [...orders];
    setOrders(orders.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      const response = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Erreur update');
      
    } catch (error) {
      console.error("Erreur update", error);
      setOrders(oldOrders);
      alert("Erreur lors de la mise à jour");
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
        case OrderStatus.PAID: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-700 border-orange-200';
        case OrderStatus.SHIPPED: return 'bg-blue-100 text-blue-700 border-blue-200';
        case OrderStatus.DELIVERED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case OrderStatus.CANCELLED: return 'bg-slate-100 text-slate-500 border-slate-200';
        default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span className="bg-red-100 p-2 rounded-lg text-red-600">
                <ShoppingBag size={24} />
             </span>
             Gestion des Commandes
          </h3>
          <p className="text-slate-500 text-sm mt-1">Suivez et gérez les commandes clients.</p>
        </div>
        
        {/* Bouton ou filtre optionnel ici si besoin */}
        {/* <button className="p-2 bg-slate-50 rounded-full md:hidden self-end">
            <Filter size={20} />
        </button> */}
      </div>

      {/* CONTENU */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-4"></div>
                Chargement...
            </div>
        ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p>Aucune commande pour le moment.</p>
            </div>
        ) : (
            <>
                {/* --- TABLEAU DESKTOP (Caché sur mobile) --- */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                                <th className="px-6 py-4 w-20">ID</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-500 font-bold">#{order.id}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="font-bold text-slate-700 block">{order.customerName}</span>
                                            <span className="text-xs text-slate-400">{order.customerEmail}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{order.date}</td>
                                    <td className="px-6 py-4 font-black text-slate-800">{order.total.toFixed(2)} €</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                            {statusTranslations[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                        <div className="relative inline-block group/select">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm"
                                            >
                                                {Object.values(OrderStatus).map(status => (
                                                    <option key={status} value={status}>
                                                        {statusTranslations[status]}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                            title="Voir détails"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- LISTE MOBILE (Cartes) --- */}
                <div className="md:hidden divide-y divide-slate-100 bg-slate-50/50">
                    {orders.map((order: any) => (
                        <div key={order.id} className="p-4 bg-white mb-2 shadow-sm first:mt-0 last:mb-0">
                            
                            {/* En-tête Carte */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                        #{order.id}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commande</span>
                                        <p className="font-bold text-slate-800 text-sm">{order.date}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                                    {statusTranslations[order.status] || order.status}
                                </span>
                            </div>

                            {/* Détails Carte */}
                            <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 mb-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><User size={14}/> Client</span>
                                    <span className="font-medium text-slate-700 text-right w-1/2 truncate">{order.customerName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><CreditCard size={14}/> Total</span>
                                    <span className="font-black text-slate-900">{order.total.toFixed(2)} €</span>
                                </div>
                            </div>

                            {/* Actions Carte */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select 
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold py-3 pl-4 pr-10 rounded-xl shadow-sm focus:border-red-500 outline-none transition-colors"
                                    >
                                        {Object.values(OrderStatus).map(status => (
                                            <option key={status} value={status}>
                                                {statusTranslations[status]}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                                    className="px-4 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
};