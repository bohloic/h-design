import React, { useState, useEffect } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { ShoppingBag, ChevronDown, Package, User, Calendar, CreditCard, Search, Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import { jwtDecode } from 'jwt-decode';
import { useAutoRefresh } from '../../src/utils/hooks/useAutoRefresh';
import { translateStatus, getStatusColorClass, OrderStatus } from '../../src/utils/statusTranslations';
import Pagination from '../../src/components/tools/Pagination';

// 🪄 LE TRADUCTEUR UNIVERSEL (Le nettoyeur de base de données)
const normalizeStatus = (dbStatus: string) => {
    if (!dbStatus) return OrderStatus.PENDING;
    const s = String(dbStatus).toLowerCase().trim();
    
    if (s === 'paid_waiting_validation' || s.includes('à valider') || s.includes('validation design')) return OrderStatus.PAID_WAITING_VALIDATION;
    if (s === 'waiting_validation' || s.includes('non payé')) return OrderStatus.WAITING_VALIDATION;
    if (s.includes('préparation') || s.includes('processing')) return OrderStatus.PROCESSING;
    if (s.includes('expédié') || s.includes('shipped')) return OrderStatus.SHIPPED;
    if (s.includes('livré') || s.includes('delivered')) return OrderStatus.DELIVERED;
    if (s.includes('retourné') || s.includes('returned')) return OrderStatus.RETURNED;
    if (s.includes('annulé') || s.includes('cancelled')) return OrderStatus.CANCELLED;
    if (s.includes('payé') || s.includes('paid')) return OrderStatus.PAID;
    if (s.includes('attente') || s.includes('pending')) return OrderStatus.PENDING;
    
    return dbStatus; 
};

export const OrderView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- FILTRES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order: any) => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `#HD-${String(order.id).padStart(5, '0')}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);
  
  useEffect(() => {
    fetchOrders(true);
  }, []);

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await authFetch('/api/orders');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      
      if (!Array.isArray(data)) throw new Error("Format invalide");

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        userId: order.user_id || order.userId,
        customerName: order.nom ? `${order.nom} ${order.prenom}` : (order.customer_name || 'Client Inconnu'),
        customerEmail: order.email || order.customer_email || '—',
        date: order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : '—',
        total: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        // 🪄 ON NORMALISE LE STATUT ICI
        status: normalizeStatus(order.status)
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
        if (showLoader) setLoading(false);
    }
  };

  useAutoRefresh(() => fetchOrders(false), 10000);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const orderBeingUpdated = orders.find((o: any) => o.id === orderId) as any;
    if (!orderBeingUpdated) return;

    // 🔒 SÉCURITÉ DE PAIEMENT : Empêcher de valider une commande non payée
    const unpaidStatuses = [OrderStatus.PENDING, OrderStatus.WAITING_VALIDATION];
    const advancedStatuses = [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.PAID_WAITING_VALIDATION];
    
    if (unpaidStatuses.includes(orderBeingUpdated.status) && advancedStatuses.includes(newStatus as any)) {
        alert("🚨 Action bloquée : Cette commande n'a pas encore été payée par le client. Vous ne pouvez pas la marquer comme Payée ou l'expédier tant que le paiement n'est pas effectif.");
        return;
    }

    const oldOrders = [...orders];
    setOrders(orders.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      const response = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }) // Le backend recevra désormais la clé anglaise propre
      });

      if (!response.ok) throw new Error('Erreur update');
      
      let targetUserId = (orderBeingUpdated as any)?.userId;
      
      // Si l'ID client n'est pas dans la liste, on le récupère du détail
      if (!targetUserId) {
          try {
              const detailRes = await authFetch(`/api/orders/${orderId}`);
              if (detailRes.ok) {
                  const detailData = await detailRes.json();
                  targetUserId = detailData.user_id || detailData.userId;
              }
          } catch (e) {
              console.error("Impossible de récupérer l'ID du client", e);
          }
      }

      let adminId = undefined;
      try {
          const token = localStorage.getItem('token');
          if (token) {
              const decoded = jwtDecode<any>(token);
              adminId = String(decoded.userId);
          }
      } catch (e) {}

      // 1. Notification (Strictement pour l'Admin)
      useNotificationStore.getState().addNotification({
        userId: adminId,
        title: "Statut mis à jour",
        message: `La commande #HD-${String(orderId).padStart(5, '0')} est passée à : ${translateStatus(newStatus)}`,
        type: newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.RETURNED ? 'error' : 'success',
        link: `/admin/orders/${orderId}`
      });

      // 2. Notification (Strictement pour le Client)
      if (targetUserId) {
          useNotificationStore.getState().addNotification({
            userId: String(targetUserId),
            title: "Mise à jour de votre commande",
            message: `Le statut de votre commande #HD-${String(orderId).padStart(5, '0')} a changé : ${translateStatus(newStatus)}`,
            type: newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.RETURNED ? 'error' : 'info',
            link: `/dashboard/orders/HD-${String(orderId).padStart(5, '0')}`
          });
      }
      
    } catch (error) {
      console.error("Erreur update", error);
      setOrders(oldOrders);
      alert("Erreur lors de la mise à jour");
    }
  };



  return (
    <div className="p-4 md:p-8 space-y-6 relative animate-in fade-in duration-500 bg-slate-50 min-h-screen">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span 
                 className="p-2 rounded-xl"
                 style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
             >
                <ShoppingBag size={24} />
             </span>
             Gestion des Commandes
          </h3>
          <p className="text-slate-500 text-sm mt-1">Suivez et gérez les commandes clients.</p>
        </div>

        {/* --- BARRE DE FILTRES --- */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher (Nom, Email, #ID)..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-theme-primary/10 focus:border-theme-primary outline-none transition-all shadow-sm"
                />
            </div>
            
            <div className="relative w-full md:w-60">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none transition-all shadow-sm focus:border-theme-primary"
                >
                    <option value="all">Tous les Statuts</option>
                    {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>
                            {translateStatus(status)}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div 
                    className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-4"
                    style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', borderTopColor: 'var(--theme-primary)' }}
                ></div>
                Chargement des commandes...
            </div>
        ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p>Aucune commande pour le moment.</p>
            </div>
        ) : (
            <>
                {/* --- TABLEAU DESKTOP --- */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                                <th className="px-6 py-4 w-28 uppercase tracking-wider text-xs">ID</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs">Client</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs">Total</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs">Statut</th>
                                <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedOrders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-500 font-bold">
                                        #HD-{String(order.id).padStart(5, '0')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="font-bold text-slate-700 block">{order.customerName}</span>
                                            <span className="text-xs text-slate-400">{order.customerEmail}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{order.date}</td>
                                    <td className="px-6 py-4 font-black text-slate-800">
                                        {order.total.toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border uppercase tracking-wider ${getStatusColorClass(order.status)}`}>
                                            {translateStatus(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                        <div className="relative inline-block group/select">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer shadow-sm theme-select"
                                            >
                                                {Object.values(OrderStatus).map(status => (
                                                    <option key={status} value={status}>
                                                        {translateStatus(status)}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors"
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
                    {paginatedOrders.map((order: any) => (
                        <div key={order.id} className="p-4 bg-white mb-2 shadow-sm first:mt-0 last:mb-0">
                            
                            {/* En-tête Carte */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="px-3 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 font-mono text-sm">
                                        #HD-{String(order.id).padStart(5, '0')}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commande</span>
                                        <p className="font-bold text-slate-800 text-sm">{order.date}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border text-center ${getStatusColorClass(order.status)}`}>
                                    {translateStatus(order.status)}
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
                                    <span className="font-black text-slate-900">{order.total.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>

                            {/* Actions Carte */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select 
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold py-3 pl-4 pr-10 rounded-xl shadow-sm theme-select"
                                    >
                                        {Object.values(OrderStatus).map(status => (
                                            <option key={status} value={status}>
                                                {translateStatus(status)}
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

                <div className="p-4 border-t border-slate-100">
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredOrders.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </>
        )}
      </div>

      {/* 🪄 STYLE MAGIQUE POUR LES SELECTS */}
      <style>{`
        .theme-select {
            transition: all 0.2s ease-in-out;
        }
        .theme-select:hover {
            border-color: color-mix(in srgb, var(--theme-primary) 40%, transparent);
        }
        .theme-select:focus {
            outline: none;
            border-color: var(--theme-primary);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 15%, transparent);
        }
      `}</style>
    </div>
  );
};