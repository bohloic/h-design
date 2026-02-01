import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, XCircle, Truck, Package, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { authFetch } from '../../src/utils/apiClient';

export const DeliveryView = () => {
  // 1. États
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
      order_id: '',
      tracking_number: '',
      carrier_name: '',
      status: 'pending',
      estimated_delivery_date: ''
  });

  // 2. Fonctions READ
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

  // 3. Gestion Formulaire
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
          tracking_number: delivery.tracking_number,
          carrier_name: delivery.carrier_name,
          status: delivery.status,
          estimated_delivery_date: formattedDate
      });
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...formData };

    try {
        let response;
        const headers = { 'Content-Type': 'application/json' };
        const url = editingId ? `/api/deliveries/${editingId}` : '/api/deliveries';
        const method = editingId ? 'PUT' : 'POST';

        response = await authFetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
            alert(editingId ? "Livraison modifiée !" : "Livraison créée !");
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

  // Helpers UI
  const getStatusStyle = (status: string) => {
      switch(status) {
          case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'returned': return 'bg-rose-100 text-rose-700 border-rose-200';
          default: return 'bg-amber-100 text-amber-700 border-amber-200'; // pending
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span className="bg-red-100 p-2 rounded-lg text-red-600">
                <Truck size={24} />
             </span>
             Suivi des Livraisons
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez les expéditions et suivez les colis.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ order_id: '', tracking_number: '', carrier_name: '', status: 'pending', estimated_delivery_date: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Livraison</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* CONTENU */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {loading ? (
            <div className="p-12 text-center text-slate-400">Chargement...</div>
        ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Package size={48} className="mb-4 opacity-20" />
                <p>Aucune livraison en cours.</p>
            </div>
        ) : (
            <>
                {/* TABLEAU DESKTOP */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                        <th className="px-6 py-4">Commande</th>
                        <th className="px-6 py-4">Transporteur</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Date Estimée</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {deliveries.map((delivery: any) => (
                            <tr key={delivery.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                    <Package size={16} className="text-red-500"/> 
                                    #{delivery.order_id}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <span className="block font-medium text-slate-700">{delivery.carrier_name}</span>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                        {delivery.tracking_number || "—"}
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
                                        ? new Date(delivery.estimated_delivery_date).toLocaleDateString() 
                                        : '—'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(delivery)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(delivery.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                                </div>
                            </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* LISTE MOBILE */}
                <div className="md:hidden divide-y divide-slate-100">
                    {deliveries.map((delivery: any) => (
                        <div key={delivery.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                            
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase">Commande</span>
                                        <p className="font-bold text-slate-800">#{delivery.order_id}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(delivery.status)}`}>
                                    {getStatusLabel(delivery.status)}
                                </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Truck size={14}/> Transporteur</span>
                                    <span className="font-medium text-slate-700">{delivery.carrier_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><MapPin size={14}/> Suivi</span>
                                    <span className="font-mono text-slate-600">{delivery.tracking_number || "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Calendar size={14}/> Estimation</span>
                                    <span className="font-medium text-slate-700">
                                        {delivery.estimated_delivery_date ? new Date(delivery.estimated_delivery_date).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-1">
                                <button onClick={() => handleEditClick(delivery)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2">
                                    <Edit size={16} /> Modifier
                                </button>
                                <button onClick={() => handleDelete(delivery.id)} className="p-2 text-red-400 bg-white border border-red-100 rounded-xl hover:bg-red-50 flex items-center justify-center">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>

      {/* MODAL RESPONSIVE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {editingId ? <Edit size={20} className="text-red-600"/> : <Plus size={20} className="text-red-600"/>}
                  {editingId ? 'Modifier' : 'Nouvelle Expédition'}
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
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none appearance-none"
                    >
                        <option value="">Choisir une commande...</option>
                        {orders.map((order: any) => (
                            <option key={order.id} value={order.id}>
                                Commande #{order.id} ({order.total_amount}€)
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Transporteur</label>
                  <input 
                    name="carrier_name" 
                    placeholder="ex: DHL"
                    value={formData.carrier_name} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">N° Suivi</label>
                  <input 
                    name="tracking_number" 
                    placeholder="XYZ-123456"
                    value={formData.tracking_number} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none font-mono" 
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
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none appearance-none"
                        >
                            <option value="pending">En attente</option>
                            <option value="in_transit">En transit</option>
                            <option value="delivered">Livré</option>
                            <option value="returned">Retourné</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Date estimée</label>
                    <input 
                        type="date"
                        name="estimated_delivery_date" 
                        value={formData.estimated_delivery_date} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none" 
                    />
                  </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 active:scale-95 mt-4"
              >
                <CheckCircle2 size={20} />
                {editingId ? 'Sauvegarder' : 'Confirmer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};