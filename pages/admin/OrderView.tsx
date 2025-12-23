import React, { useState, useEffect } from 'react';

// On définit les statuts exactement comme dans ta base MySQL (ENUM)
const OrderStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const OrderView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. CHARGEMENT DES DONNÉES DEPUIS LA BDD
  useEffect(() => {
    fetchOrders();
  }, []);


  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:205/api/orders'); // Ton port semble être 205
      
      // 1. VÉRIFICATION D'ERREUR HTTP
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // 2. VÉRIFICATION DU FORMAT DES DONNÉES
      if (!Array.isArray(data)) {
         console.error("Données reçues non valides:", data);
         throw new Error("Le serveur n'a pas renvoyé une liste de commandes.");
      }

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        // Sécurité : on vérifie si first_name existe, sinon on met "Inconnu"
        customerName: order.first_name ? `${order.first_name} ${order.last_name}` : 'Client Inconnu',
        customerEmail: order.email || 'Email non renseigné',
        date: order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'Date inconnue',
        total: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        status: order.status
      }));

      setOrders(formattedOrders);
      setLoading(false);

    } catch (error) {
      console.error("Erreur de chargement:", error);
      setLoading(false);
      // Tu peux ajouter un état d'erreur pour l'afficher à l'utilisateur
      // setError(true); 
    }
  };

  // 2. CHANGEMENT DE STATUT EN TEMPS RÉEL
  const handleStatusChange = async (orderId, newStatus) => {
    // Optimisme : On met à jour l'interface tout de suite pour que ce soit rapide
    const oldOrders = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      // Envoi de la requête au serveur
      const response = await fetch(`http://localhost:205/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Décommente si tu as activé la sécu
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erreur update');
      }
      
      console.log(`Commande #${orderId} passée en ${newStatus}`);

    } catch (error) {
      console.error("Erreur lors de la mise à jour", error);
      // Si ça plante, on remet l'ancien état (Rollback visuel)
      setOrders(oldOrders);
      alert("Impossible de modifier le statut");
    }
  };

  // Styles pour les badges (adaptés aux valeurs MySQL)
  const statusStyles = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [OrderStatus.PAID]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [OrderStatus.PREPARING]: 'bg-orange-100 text-orange-700 border-orange-200',
    [OrderStatus.SHIPPED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [OrderStatus.DELIVERED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [OrderStatus.CANCELLED]: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  if (loading) return <div className="p-8">Chargement des commandes...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Gestion des Commandes</h3>
          <p className="text-slate-500">Données en temps réel de la base de données.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-900">#{order.id}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{order.customerName}</span>
                    <span className="text-xs text-slate-400">{order.customerEmail}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{order.date}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{order.total.toFixed(2)} €</td>
                
                {/* Badge de Statut */}
                <td className="px-6 py-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyles[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                </td>

                {/* Sélecteur d'Action */}
                <td className="px-6 py-4 text-right">
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-200 transition"
                  >
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {orders.length === 0 && (
            <div className="p-8 text-center text-slate-500">Aucune commande trouvée.</div>
        )}
      </div>
    </div>
  );
};