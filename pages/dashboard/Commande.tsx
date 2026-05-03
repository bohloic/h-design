import { formatCurrency } from "@/constants";
import { Gift, Package, Star, Calendar, CreditCard, ChevronRight } from "lucide-react";
import React, { useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { translateStatus, getStatusColorClass } from '@/src/utils/statusTranslations';
import Pagination from "@/src/components/tools/Pagination";

export const Commande: React.FC = () => {
    const { orders } = useOutletContext<{ orders: any[] }>();
    const [isPaying, setIsPaying] = useState<number | null>(null);

    const handlePayNow = async (order: any) => {
        setIsPaying(order.id);
        try {
            const response = await fetch('/api/payment/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    email: order.customer_email || '', 
                    amount: order.total_amount,
                    orderId: order.id,
                    callbackUrl: window.location.origin
                })
            });

            const data = await response.json();
            if (data.success && data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                alert(data.message || "Erreur lors de l'initialisation du paiement");
            }
        } catch (error) {
            console.error("Erreur paiement:", error);
            alert("Erreur technique lors de la redirection vers Paystack");
        } finally {
            setIsPaying(null);
        }
    };

    let total = 0;
    orders?.forEach((o: any) => {
        // Remplacement de parseInt par parseFloat au cas où tu as des centimes
        total += Number.parseFloat(o.total_amount) || 0;
    });

    // 🪄 PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const paginatedOrders = useMemo(() => {
        if (!orders) return [];
        const start = (currentPage - 1) * itemsPerPage;
        return orders.slice(start, start + itemsPerPage);
    }, [orders, currentPage]);



    // SINON, ON AFFICHE LA LISTE NORMALE
    return(
        <div>
            <main className="flex-1 space-y-6 lg:space-y-8 animate-in fade-in duration-300">
                {/* --- STATISTIQUES (Cards) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div 
                        className="p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden bg-theme-primary"
                    >
                        <Package className="w-8 h-8 mb-4 opacity-50 absolute right-4 top-4" />
                        <p className="text-white/70 text-xs md:text-sm font-bold uppercase tracking-widest">Total Dépensé</p>
                        <h3 className="text-2xl md:text-3xl font-black mt-1">{formatCurrency(total)}</h3>
                    </div>
                    
                    <div className="bg-white dark:bg-[#1A1A1C] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">Fidélité</p>
                            <Star className="w-6 h-6 text-amber-400 dark:text-amber-500" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800 dark:text-pure">Argent</h3>
                    </div>
                    
                    <div className="bg-white dark:bg-[#1A1A1C] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">Offres</p>
                            <Gift className="w-6 h-6 text-green-600 dark:text-green-500" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800 dark:text-pure">03</h3>
                    </div>
                </div>

                {/* --- HISTORIQUE --- */}
                <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                    <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5">
                        <h3 className="text-xl md:text-2xl font-bold dark:text-pure transition-colors">Historique des commandes</h3>
                    </div>
                    
                    {(!orders || orders.length === 0) ? (
                        <div className="p-8 text-center text-slate-500">Aucune commande pour le moment.</div>
                    ) : (
                        <>
                            {/* TABLEAU DESKTOP */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-[#202022] border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">N° Commande</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Montant</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Statut</th>
                                            <th className="px-8 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {paginatedOrders.map((ord: any) => (
                                            <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-6 font-bold text-slate-800 dark:text-pure">#HD-{String(ord.id).padStart(5, '0')}</td>
                                                <td className="px-8 py-6 text-slate-500 dark:text-slate-400">{new Date(ord.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-8 py-6 font-black text-theme-primary">
                                                    {formatCurrency(ord.total_amount)}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {/* 🪄 STATUT TRADUIT ET COLORÉ */}
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider dark:border border-transparent ${getStatusColorClass(ord.status)}`}>
                                                        {translateStatus(ord.status)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <Link 
                                                            to={`/dashboard/orders/HD-${String(ord.id).padStart(5, '0')}`}
                                                            className="font-bold hover:underline text-sm transition-all text-theme-primary" 
                                                        >
                                                            Détails
                                                        </Link>
                                                        
                                                        {(ord.status.includes('attente de paiement') || ord.status.toLowerCase() === 'pending') && (
                                                            <button 
                                                                onClick={() => handlePayNow(ord)}
                                                                disabled={isPaying === ord.id}
                                                                className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200 dark:shadow-none active:scale-95 disabled:opacity-50"
                                                            >
                                                                {isPaying === ord.id ? '...' : 'Payer maintenant ✅'}
                                                            </button>
                                                        )}
                                                     </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* LISTE MOBILE */}
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                                {paginatedOrders.map((ord: any) => (
                                    <div key={ord.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Commande</span>
                                                <p className="font-bold text-slate-800 dark:text-pure">#HD-{String(ord.id).padStart(5, '0')}</p>
                                            </div>
                                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                                                <Calendar size={14} className="mr-1" />
                                                {new Date(ord.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] border dark:border-white/5 p-3 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={16} className="text-slate-400 dark:text-slate-500" />
                                                <span className="font-black text-theme-primary">
                                                    {formatCurrency(ord.total_amount)}
                                                </span>
                                            </div>
                                            {/* 🪄 STATUT TRADUIT ET COLORÉ (MOBILE) */}
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider dark:border border-transparent ${getStatusColorClass(ord.status)}`}>
                                                {translateStatus(ord.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <Link 
                                                to={`/dashboard/orders/HD-${String(ord.id).padStart(5, '0')}`}
                                                className="flex items-center justify-between text-sm font-bold text-slate-600 hover-theme-text transition-colors"
                                            >
                                                <span>Voir les détails</span>
                                                <ChevronRight size={16} />
                                            </Link>

                                            {(ord.status.includes('attente de paiement') || ord.status.toLowerCase() === 'pending') && (
                                                <button 
                                                    onClick={() => handlePayNow(ord)}
                                                    disabled={isPaying === ord.id}
                                                    className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200 dark:shadow-none active:scale-95 disabled:opacity-50"
                                                >
                                                    {isPaying === ord.id ? '...' : 'Payer maintenant ✅'}
                                                </button>
                                            )}
                                         </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-white/5">
                                <Pagination 
                                    currentPage={currentPage}
                                    totalItems={orders.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
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