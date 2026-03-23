import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, XCircle, Truck, Package, Calendar, MapPin, CheckCircle2, User } from 'lucide-react';
import { authFetch } from '../../src/utils/apiClient';

export const DeliveryView = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]); 
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
      order_id: '',
      tracking_number: '',
      carrier_name: '',
      status: 'pending',
      estimated_delivery_date: ''
  });

  const formatOrderId = (id: string | number) => {
      if (!id) return '';
      return `#HD-${String(id).padStart(5, '0')}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deliveriesRes, ordersRes] = await Promise.all([
          authFetch('/api/deliveries'),
          authFetch('/api/orders')
      ]);
      
      const deliveriesData = await deliveriesRes.json();
      const ordersData = await ordersRes.json();
      
      setDeliveries(deliveriesData); 
      setOrders(ordersData);
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };  

  const handleEditClick = (delivery: any) => {
      setEditingId(delivery.id);
      
      let formattedDate = '';
      if(delivery.estimated_delivery_date) {
        formattedDate = new Date(delivery.estimated_delivery_date).toISOString().split('T')[0];
      }

      setFormData({
          order_id: delivery.order_id,
          tracking_number: delivery.tracking_number || '',
          carrier_name: delivery.carrier_name || '',
          status: delivery.status,
          estimated_delivery_date: formattedDate
      });
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...formData };

    try {
        const headers = { 'Content-Type': 'application/json' };
        const url = editingId ? `/api/deliveries/${editingId}` : '/api/deliveries';
        const method = editingId ? 'PUT' : 'POST';

        const response = await authFetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
            setIsModalOpen(false);
            fetchData(); 
            setEditingId(null);
            setFormData({ order_id: '', tracking_number: '', carrier_name: '', status: 'pending', estimated_delivery_date: '' });
        } else {
            const errorData = await response.json();
            alert("Erreur : " + errorData.message);
        }
    } catch (error) {
        console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette livraison ?")) return;
    try {
        const response = await authFetch(`/api/deliveries/${id}`, { method: 'DELETE' });
        if (response.ok) {
            setDeliveries(prev => prev.filter((d: any) => d.id !== id));
        } else {
            alert("Impossible de supprimer.");
        }
    } catch (error) {
        console.error("Erreur suppression :", error);
    }
  };

  const getStatusStyle = (status: string) => {
      switch(status) {
          case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'returned': return 'bg-rose-100 text-rose-700 border-rose-200';
          default: return 'bg-amber-100 text-amber-700 border-amber-200'; 
      }
  };

  const getStatusLabel = (status: string) => {
      const labels: any = {
          'pending': 'En attente',
          'in_transit': 'En transit',
          'delivered': 'Livré',
          'returned': 'Retourné'
      };
      return labels[status] || status;
  }

  const getOrderDetails = (orderId: number | string) => {
      if (!orderId) return {};
      return orders.find((o: any) => String(o.id) === String(orderId)) || {};
  };

  const availableOrdersToShip = orders.filter((o: any) => {
      const isPaid = o.status === 'paid' || o.payment_method === 'Espèces';
      const hasNoDeliveryYet = !deliveries.some((d: any) => String(d.order_id) === String(o.id));
      return isPaid && hasNoDeliveryYet;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
             >
                <Truck size={24} />
             </span>
             Suivi des Livraisons
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez les expéditions locales et internationales.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ order_id: '', tracking_number: '', carrier_name: '', status: 'pending', estimated_delivery_date: '' });
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: 'var(--theme-primary)' }}
          className="w-full sm:w-auto text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-95 hover:opacity-100 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Livraison</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
               <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-4"
                  style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', borderTopColor: 'var(--theme-primary)' }}
               ></div>
               Chargement...
            </div>
        ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Package size={48} className="mb-4 opacity-20" />
                <p>Aucune livraison en cours.</p>
            </div>
        ) : (
            <>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                        <th className="px-6 py-4">Commande & Client</th>
                        <th className="px-6 py-4">Transporteur</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Date Estimée</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {deliveries.map((delivery: any) => {
                            const clientInfo = getOrderDetails(delivery.order_id);
                            return (
                            <tr key={delivery.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                        <Package size={16} style={{ color: 'var(--theme-primary)' }}/> 
                                        {formatOrderId(delivery.order_id)}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <User size={12} /> {clientInfo.customer_name || clientInfo.nom || 'Client inconnu'} 
                                        {clientInfo.city && ` (${clientInfo.city})`}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <span className="block font-medium text-slate-700">{delivery.carrier_name || "Non défini"}</span>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                        {delivery.tracking_number || "Pas de suivi"}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(delivery.status)}`}>
                                {getStatusLabel(delivery.status)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400"/>
                                    {delivery.estimated_delivery_date 
                                        ? new Date(delivery.estimated_delivery_date).toLocaleString() 
                                        : '—'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(delivery)} className="p-2 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"><Edit size={18} /></button>
                                <button 
                                    onClick={() => handleDelete(delivery.id)} 
                                    className="p-2 text-slate-400 bg-white rounded-lg transition-all border border-transparent hover:border-red-100 hover:bg-red-50"
                                    style={{ color: 'var(--theme-primary)' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                                </div>
                            </td>
                            </tr>
                        )})}
                    </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
                    {deliveries.map((delivery: any) => {
                        const clientInfo = getOrderDetails(delivery.order_id);
                        return (
                        <div key={delivery.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                            
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{formatOrderId(delivery.order_id)}</p>
                                        <span className="text-xs font-medium text-slate-500 truncate max-w-[150px] block">
                                            {clientInfo.customer_name || clientInfo.nom || 'Client inconnu'}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(delivery.status)}`}>
                                    {getStatusLabel(delivery.status)}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Truck size={14}/> Transporteur</span>
                                    <span className="font-medium text-slate-700">{delivery.carrier_name || "Non défini"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><MapPin size={14}/> Suivi</span>
                                    <span className="font-mono text-slate-600">{delivery.tracking_number || "—"}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-1">
                                <button onClick={() => handleEditClick(delivery)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2">
                                    <Edit size={16} /> Modifier
                                </button>
                                <button 
                                    onClick={() => handleDelete(delivery.id)} 
                                    className="flex-1 py-2 text-sm font-bold bg-white border rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
                                    style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                                >
                                    <Trash2 size={16} /> Supprimer
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {editingId 
                      ? <Edit size={20} style={{ color: 'var(--theme-primary)' }}/> 
                      : <Plus size={20} style={{ color: 'var(--theme-primary)' }}/>
                  }
                  {editingId ? 'Modifier Livraison' : 'Nouvelle Expédition'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                  <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Commande associée</label>
                <div className="relative">
                    <select 
                        name="order_id" 
                        value={formData.order_id} 
                        onChange={handleChange} 
                        required 
                        disabled={!!editingId}
                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none appearance-none disabled:opacity-60 transition-all focus:bg-white focus:ring-2"
                    >
                        {editingId ? (
                            <option value={formData.order_id}>Commande {formatOrderId(formData.order_id)}</option>
                        ) : (
                            <>
                                <option value="">Choisir une commande payée...</option>
                                {availableOrdersToShip.map((order: any) => (
                                    <option key={order.id} value={order.id}>
                                        {formatOrderId(order.id)} - {order.customer_name || order.nom || 'Client'} ({order.total_amount} FCFA)
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
                {!editingId && availableOrdersToShip.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">Aucune nouvelle commande payée en attente d'expédition.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Transporteur</label>
                  <input 
                    name="carrier_name" 
                    placeholder="Livreur Moto, DHL..."
                    value={formData.carrier_name} 
                    onChange={handleChange} 
                    style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none transition-all focus:bg-white focus:ring-2" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">N° Suivi (Optionnel)</label>
                  <input 
                    name="tracking_number" 
                    placeholder="Lien ou Code"
                    value={formData.tracking_number} 
                    onChange={handleChange} 
                    style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-mono transition-all focus:bg-white focus:ring-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Statut</label>
                    <div className="relative">
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange} 
                            style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none appearance-none transition-all focus:bg-white focus:ring-2"
                        >
                            <option value="pending">Préparation</option>
                            <option value="in_transit">En route</option>
                            <option value="delivered">Livré</option>
                            <option value="returned">Retourné</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Date estimée</label>
                    <input 
                        type="datetime-local"
                        name="estimated_delivery_date" 
                        value={formData.estimated_delivery_date} 
                        onChange={handleChange} 
                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none transition-all focus:bg-white focus:ring-2" 
                    />
                  </div>
              </div>
              
              <button 
                type="submit" 
                disabled={!editingId && !formData.order_id}
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="w-full py-4 text-white font-bold rounded-xl opacity-95 hover:opacity-100 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={20} />
                {editingId ? 'Sauvegarder' : 'Confirmer l\'expédition'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};