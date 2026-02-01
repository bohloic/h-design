import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../src/utils/apiClient';
import { 
    ChevronLeft, Package, User, MapPin, CreditCard, 
    Calendar, Printer, Mail, Phone, Shirt, Palette, Loader2, Sparkles
} from 'lucide-react';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { AdminDesignPreview } from '@/src/components/admin/AdminDesignPreview';

const getStatusStyle = (status) => {
    switch(status) {
        case 'paid': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'preparing': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
        default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
};

export const OrderDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await authFetch(`/api/orders/${id}`);
                if (!response.ok) throw new Error("Erreur chargement");
                const data = await response.json();
                setOrder(data);
            } catch (error) {
                console.error(error);
                alert("Impossible de charger la commande");
                navigate('/admin/orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [id, navigate]);

    if (loading || !order) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            </div>
        );
    }

    // --- CALCUL DES TOTAUX ---
    // 1. Sous-total = Somme (Prix unitaire * Quantité)
    const subTotal = order.items.reduce((acc, item) => acc + (parseFloat(item.unit_price) * item.quantity), 0);
    
    // 2. Total Commande (Vient de la DB)
    const totalOrderAmount = parseFloat(order.total_amount);

    // 3. Livraison = Total - Sous-total
    // (Si le résultat est négatif à cause d'arrondis, on met 0)
    const shippingCost = Math.max(0, totalOrderAmount - subTotal);

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 bg-slate-50 min-h-screen">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors mb-2 text-sm font-bold"
                    >
                        <ChevronLeft size={16} /> Retour
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                            Commande #{order.id}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                            {order.status}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <Calendar size={14} /> 
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <button 
                    onClick={() => window.print()}
                    className="bg-white border-2 border-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:border-red-100 hover:text-red-600 transition-all shadow-sm"
                >
                    <Printer size={18} /> <span className="hidden sm:inline">Imprimer</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* GAUCHE : ARTICLES (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Package className="text-red-600" /> Articles commandés ({order.items.length})
                            </h3>
                        </div>

                        {/* DESKTOP */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Produit</th>
                                        <th className="px-6 py-4">Détails & Personnalisation</th>
                                        <th className="px-6 py-4 text-center">Qté</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 align-top w-64">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                                                        <img 
                                                            src={item.image_url ? BASE_IMG_URL + item.image_url : ''} 
                                                            alt={item.product_name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{item.product_name}</p>
                                                        <p className="text-xs text-slate-400">Réf: {item.product_id}</p>
                                                        {item.customization && (
                                                            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full shadow-sm">
                                                                <Sparkles size={10} /> PERSONNALISÉ
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="space-y-4 text-sm text-slate-600">
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.size && (
                                                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
                                                                <Shirt size={12} className="text-slate-400"/> 
                                                                <span className="font-bold">{item.size}</span>
                                                            </div>
                                                        )}
                                                        {item.color && (
                                                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
                                                                <Palette size={12} className="text-slate-400"/> 
                                                                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: item.color }}></span>
                                                                <span>{item.color}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* MAQUETTE VISUELLE */}
                                                    {item.customization && (
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full">
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                                                                <Sparkles size={14} className="text-red-600"/> Atelier de Personnalisation
                                                            </p>
                                                            
                                                            <AdminDesignPreview 
                                                                productImage={item.image_url} 
                                                                customizationJson={item.customization} 
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-900 align-top">
                                                x{item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 align-top">
                                                {(item.unit_price * item.quantity).toLocaleString()} FCFA
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-4 flex flex-col gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                                            <img src={item.image_url ? BASE_IMG_URL + item.image_url : ''} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{item.product_name}</h4>
                                                <span className="font-bold text-slate-900 text-sm">{(item.unit_price * item.quantity).toLocaleString()}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {item.size && <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 font-bold">{item.size}</span>}
                                                {item.color && (
                                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: item.color }}></span>
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="text-xs text-slate-500 font-medium mt-2">
                                                Qté: {item.quantity} x {parseFloat(item.unit_price).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {item.customization && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 mb-2 border-b border-slate-100 pb-2">
                                                <Sparkles size={12} /> PERSONNALISÉ
                                            </div>
                                            <div className="overflow-x-auto">
                                                <AdminDesignPreview 
                                                    productImage={item.image_url} 
                                                    customizationJson={item.customization} 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* TOTAL BAS (CORRIGÉ AVEC LIVRAISON) */}
                        <div className="bg-slate-50 p-6 border-t border-slate-100">
                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex justify-between w-full md:w-72 text-sm text-slate-500">
                                    <span>Sous-total</span>
                                    <span>{subTotal.toLocaleString()} FCFA</span>
                                </div>
                                <div className="flex justify-between w-full md:w-72 text-sm text-slate-500">
                                    <span>Livraison</span>
                                    {/* On affiche le montant calculé */}
                                    <span className={shippingCost > 0 ? "text-slate-800" : "text-green-600 font-bold"}>
                                        {shippingCost > 0 ? `${shippingCost.toLocaleString()} FCFA` : "Gratuite"}
                                    </span>
                                </div>
                                <div className="w-full md:w-72 border-t border-slate-200 my-2"></div>
                                <div className="flex justify-between w-full md:w-72 text-xl font-black text-slate-900">
                                    <span>Total</span>
                                    <span className="text-red-600">{totalOrderAmount.toLocaleString()} FCFA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DROITE : INFOS */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                            <User className="text-red-600" size={20} /> Client
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-2xl border border-red-100 shadow-sm">
                                {order.prenom ? order.prenom.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">{order.prenom} {order.nom}</p>
                                <p className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded inline-block">ID: #{order.user_id}</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3 text-slate-600 group">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <a href={`mailto:${order.email}`} className="hover:text-red-600 transition-colors font-medium">{order.email}</a>
                            </div>
                            {order.phone && (
                                <div className="flex items-center gap-3 text-slate-600 group">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <span className="font-medium">{order.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                            <MapPin className="text-red-600" size={20} /> Livraison
                        </h3>
                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {order.shipping_address ? (
                                <p className="font-medium">{order.shipping_address}</p>
                            ) : (
                                <span className="italic text-slate-400">Adresse non renseignée</span>
                            )}
                            <p className="mt-1 text-xs text-slate-400 uppercase tracking-wide">Abidjan, Côte d'Ivoire</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                            <CreditCard className="text-red-600" size={20} /> Paiement
                        </h3>
                        <div className="flex justify-between items-center text-sm p-3 bg-green-50 rounded-xl border border-green-100 text-green-800 font-bold">
                            <span>Statut</span>
                            <span>{order.status === 'paid' ? 'PAYÉ ✅' : 'EN ATTENTE ⏳'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};