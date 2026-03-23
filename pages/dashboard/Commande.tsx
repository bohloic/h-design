import { formatCurrency } from "@/constants";
import { Gift, Package, Star, Calendar, CreditCard, ChevronRight } from "lucide-react";
import React, { useState } from 'react';
import { OrderDetails } from './OrderDetails'; // 🪄 Assure-toi que le fichier est bien au même endroit

// On ajoute une interface pour dire que ce composant reçoit "orders"
interface CommandeProps {
    orders: any[];
}

export const Commande: React.FC<CommandeProps> = ({ orders }) => {
    // 🪄 ÉTAT POUR L'AFFICHAGE DES DÉTAILS
    const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);

    let total = 0;
    orders?.forEach((o: any) => {
        // Remplacement de parseInt par parseFloat au cas où tu as des centimes
        total += Number.parseFloat(o.total_amount) || 0;
    });

    // 🪄 FONCTIONS POUR TRADUIRE ET COLORER LES STATUTS
    const translateStatus = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pending') || s.includes('attente')) return 'En attente';
        if (s.includes('validation')) return 'Validation Design';
        if (s.includes('paid') || s.includes('payé')) return 'Payé';
        if (s.includes('processing') || s.includes('préparation')) return 'En préparation';
        if (s.includes('shipped') || s.includes('expédié')) return 'Expédié';
        if (s.includes('delivered') || s.includes('livré')) return 'Livré';
        if (s.includes('cancelled') || s.includes('annulé')) return 'Annulé';
        return status || 'Inconnu';
    };

    const getStatusStyle = (status: string) => {
        const translated = translateStatus(status);
        switch (translated) {
            case 'En attente': return 'bg-amber-100 text-amber-700';
            case 'Payé': return 'bg-emerald-100 text-emerald-700';
            case 'En préparation': return 'bg-blue-100 text-blue-700';
            case 'Expédié': return 'bg-purple-100 text-purple-700';
            case 'Livré': return 'bg-green-100 text-green-700';
            case 'Annulé': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // 🪄 SI ON A CLIQUÉ SUR UNE COMMANDE, ON AFFICHE LES DÉTAILS
    if (selectedOrderId) {
        return <OrderDetails orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />;
    }

    // SINON, ON AFFICHE LA LISTE NORMALE
    return(
        <div>
            <main className="flex-1 space-y-6 lg:space-y-8 animate-in fade-in duration-300">
                {/* --- STATISTIQUES (Cards) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div 
                        className="p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                        <Package className="w-8 h-8 mb-4 opacity-50 absolute right-4 top-4" />
                        <p className="text-white/70 text-xs md:text-sm font-bold uppercase tracking-widest">Total Dépensé</p>
                        <h3 className="text-2xl md:text-3xl font-black mt-1">{formatCurrency(total)}</h3>
                    </div>
                    
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest">Fidélité</p>
                            <Star className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">Argent</h3>
                    </div>
                    
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest">Offres</p>
                            <Gift className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">03</h3>
                    </div>
                </div>

                {/* --- HISTORIQUE --- */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100">
                        <h3 className="text-xl md:text-2xl font-bold">Historique des commandes</h3>
                    </div>
                    
                    {(!orders || orders.length === 0) ? (
                        <div className="p-8 text-center text-slate-500">Aucune commande pour le moment.</div>
                    ) : (
                        <>
                            {/* TABLEAU DESKTOP */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">N° Commande</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Montant</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {orders.map((ord: any) => (
                                            <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-6 font-bold text-slate-800">#HD-{String(ord.id).padStart(5, '0')}</td>
                                                <td className="px-8 py-6 text-slate-500">{new Date(ord.created_at).toLocaleDateString('fr-FR')}</td>
                                                <td className="px-8 py-6 font-black" style={{ color: 'var(--theme-primary)' }}>
                                                    {formatCurrency(ord.total_amount)}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {/* 🪄 STATUT TRADUIT ET COLORÉ */}
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(ord.status)}`}>
                                                        {translateStatus(ord.status)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {/* 🪄 BOUTON POUR VOIR LES DÉTAILS */}
                                                    <button 
                                                        onClick={() => setSelectedOrderId(ord.id)}
                                                        className="font-bold hover:underline text-sm transition-all" 
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    >
                                                        Détails
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* LISTE MOBILE */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {orders.map((ord: any) => (
                                    <div key={ord.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase">Commande</span>
                                                <p className="font-bold text-slate-800">#HD-{String(ord.id).padStart(5, '0')}</p>
                                            </div>
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <Calendar size={14} className="mr-1" />
                                                {new Date(ord.created_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={16} className="text-slate-400" />
                                                <span className="font-black" style={{ color: 'var(--theme-primary)' }}>
                                                    {formatCurrency(ord.total_amount)}
                                                </span>
                                            </div>
                                            {/* 🪄 STATUT TRADUIT ET COLORÉ (MOBILE) */}
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(ord.status)}`}>
                                                {translateStatus(ord.status)}
                                            </span>
                                        </div>
                                        {/* 🪄 BOUTON POUR VOIR LES DÉTAILS (MOBILE) */}
                                        <button 
                                            onClick={() => setSelectedOrderId(ord.id)}
                                            className="w-full flex items-center justify-between text-sm font-bold text-slate-600 pt-1 hover-theme-text transition-colors"
                                        >
                                            <span>Voir les détails</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* 🪄 STYLE POUR LE HOVER MOBILE */}
            <style>{`
                .hover-theme-text:hover {
                    color: var(--theme-primary) !important;
                }
            `}</style>
        </div>
    )
}