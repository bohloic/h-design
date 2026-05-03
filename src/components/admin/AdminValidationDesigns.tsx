import React, { useEffect, useState } from 'react';
import { authFetch } from '@/src/utils/apiClient';
import { useToast } from '@/src/utils/context/ToastContext';
import { formatCurrency } from '@/constants';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { CheckCircle, XCircle, Palette, Eye, Loader2, AlertCircle, PackageX, RefreshCw } from 'lucide-react';
import { useAutoRefresh } from '@/src/utils/hooks/useAutoRefresh';

export const AdminValidationDesigns = () => {
    const { showToast } = useToast();
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // 1. CHARGEMENT DES COMMANDES EN ATTENTE DE DESIGN
    const fetchPendingDesigns = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await authFetch('/api/admin/orders'); 
            if (response.ok) {
                const allOrders = await response.json();
                setPendingOrders(allOrders);
            }
        } catch (error) {
            console.error("Erreur chargement des designs :", error);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingDesigns(true);
    }, []);

    // 🔄 Auto-actualisation discrète toutes les 20 secondes
    useAutoRefresh(() => {
        fetchPendingDesigns(false);
    }, 20000);

    // 👁️ Marquer les designs comme vus quand ils sont affichés
    useEffect(() => {
        if (pendingOrders.length > 0) {
            pendingOrders.forEach(async (order) => {
                if (order.is_seen === 0) {
                    try {
                        await authFetch(`/api/admin/orders/${order.id}/seen`, { method: 'PUT' });
                    } catch (e) { /* Discret */ }
                }
            });
        }
    }, [pendingOrders]);

    // 2. GESTION DES DÉCISIONS PAR ARTICLE
    const [itemDecisions, setItemDecisions] = useState<Record<number, { status: 'approved' | 'rejected' | 'pending', reason?: string }>>({});

    const handleItemAction = (itemId: number, status: 'approved' | 'rejected') => {
        if (status === 'rejected') {
            const reason = window.prompt("Motif du rejet de cet article :");
            if (!reason) return;
            setItemDecisions(prev => ({ ...prev, [itemId]: { status, reason } }));
        } else {
            setItemDecisions(prev => ({ ...prev, [itemId]: { status } }));
        }
    };

    // 3. SOUMISSION FINALE DE LA DÉCISION
    const handleFinalSubmit = async (order: any) => {
        const decisionsArray = order.items
            .filter((item: any) => itemDecisions[item.id]) // On n'envoie que les nouvelles décisions
            .map((item: any) => ({
                id: item.id,
                status: itemDecisions[item.id]?.status,
                reason: itemDecisions[item.id]?.reason || ''
            }));

        if (decisionsArray.length === 0) {
            showToast("Aucune nouvelle décision à soumettre.", "info");
            return;
        }

        const pendingCount = order.items.filter((item: any) => {
            // On vérifie si l'article est personnalisable
            let designData: any = null;
            try {
                if (item.customization) {
                    designData = typeof item.customization === 'string' 
                        ? JSON.parse(item.customization) 
                        : item.customization;
                }
            } catch (e) {}
            
            const isCustom = !!(designData?.customizationImage || (designData?.elements && designData.elements.length > 0));
            
            // On ne compte que les articles personnalisables qui n'ont pas encore de décision
            return isCustom && !['Validé', 'approved'].includes(item.design_status) && !itemDecisions[item.id];
        }).length;

        if (pendingCount > 0) {
            showToast(`Il reste ${pendingCount} article(s) personnalisable(s) sans décision. Vous devez tous les valider ou refuser avant de confirmer.`, "error");
            return;
        }

        try {
            setProcessingId(order.id);
            // On envoie le tableau de décisions au backend. 
            // Note: Nous utilisons l'ID de la commande pour mettre à jour les éléments liés.
            const response = await authFetch(`/api/admin/orders/${order.id}/validate-items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decisions: decisionsArray })
            });

            if (response.ok) {
                showToast("✅ Décisions enregistrées !", "success");
                
                // 🪄 On nettoie immédiatement l'affichage local
                setPendingOrders(prev => prev.filter(o => o.id !== order.id));
                
                // Nettoyage des décisions locales pour cette commande
                setItemDecisions(prev => {
                    const next = { ...prev };
                    order.items.forEach((item: any) => delete next[item.id]);
                    return next;
                });

                // On relance un fetch discret pour être sûr d'être à jour
                setTimeout(() => fetchPendingDesigns(false), 500);
            } else {
                const errorData = await response.json();
                showToast(errorData.message || "Erreur lors de la mise à jour.", "error");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-10 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-2xl">
                        <Palette size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Validations Design</h2>
                        <p className="text-slate-500 text-sm">Examinez les créations sur-mesure de vos clients</p>
                    </div>
                </div>
                <div className="text-center bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
                    <span className="text-3xl font-black text-fuchsia-600">{pendingOrders.length}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En attente</p>
                </div>
            </div>

            {pendingOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 flex flex-col items-center shadow-sm">
                    <CheckCircle size={56} className="text-emerald-400 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-slate-700">Aucun design à valider</h3>
                    <p className="text-slate-500 mt-2">Vous êtes à jour ! Vos équipes peuvent souffler.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pendingOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            
                            {/* EN-TÊTE CARTE */}
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cmd #HD-{String(order.id).padStart(5, '0')}</span>
                                    <h4 className="font-bold text-slate-900 mt-0.5">{order.customer_name || 'Client Inconnu'}</h4>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-bold bg-fuchsia-100 text-fuchsia-700 px-3 py-1.5 rounded-full">
                                        {formatCurrency(order.total_amount)}
                                    </span>
                                    {order.status.includes('Payé') && (
                                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            Payé
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CONTENU (Articles & Designs) */}
                            <div className="p-5 flex-1 space-y-4">
                                {order.items?.map((item: any, idx: number) => {
                                    let designData: any = null;
                                    try {
                                        if (item.customization) {
                                            designData = typeof item.customization === 'string' 
                                                ? JSON.parse(item.customization) 
                                                : item.customization;
                                        }
                                    } catch (e) {
                                        console.error("Erreur de parsing JSON pour la customisation :", e);
                                    }

                                    const imgUrl = designData?.customizationImage || designData?.image || item.image_url || null;
                                    const isCustomizable = !!(designData?.customizationImage || (designData?.elements && designData.elements.length > 0));
                                    const decision = itemDecisions[item.id];

                                    return (
                                        <div key={idx} className={`p-4 rounded-2xl border transition-all relative ${
                                            decision?.status === 'approved' || item.design_status === 'approved' || item.design_status === 'Validé' ? 'bg-emerald-50/50 border-emerald-100' : 
                                            decision?.status === 'rejected' || item.design_status === 'rejected' || item.design_status === 'Refusé' ? 'bg-red-50/50 border-red-100' : 
                                            'bg-slate-50 border-slate-100'
                                        }`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 line-clamp-1 pr-16">{item.name || item.product_name || 'Article'}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                                        {isCustomizable ? '✨ Personnalisé' : '📦 Standard'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 items-center">
                                                    {isCustomizable && (
                                                        <>
                                                            {['Validé', 'approved'].includes(item.design_status) ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-200">
                                                                        <CheckCircle size={12} /> Validé
                                                                    </span>
                                                                    <span className="text-[8px] text-slate-400 mt-1 font-bold italic">Décision verrouillée</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        onClick={() => handleItemAction(item.id, 'rejected')}
                                                                        title="Refuser le design"
                                                                        className={`p-2 rounded-xl transition-all shadow-sm ${itemDecisions[item.id]?.status === 'rejected' ? 'bg-red-500 text-white scale-110 shadow-red-200' : 'bg-white text-slate-400 hover:text-red-500 border border-slate-100 hover:border-red-100'}`}
                                                                    >
                                                                        <XCircle size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleItemAction(item.id, 'approved')}
                                                                        title="Valider le design"
                                                                        className={`p-2 rounded-xl transition-all shadow-sm ${itemDecisions[item.id]?.status === 'approved' ? 'bg-emerald-500 text-white scale-110 shadow-emerald-200' : 'bg-white text-slate-400 hover:text-emerald-500 border border-slate-100 hover:border-emerald-100'}`}
                                                                    >
                                                                        <CheckCircle size={16} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {imgUrl ? (
                                                <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                    <img src={BASE_IMG_URL + imgUrl} alt={isCustomizable ? "Design client" : "Produit standard"} className="w-full h-40 object-contain p-2" />
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                                        <button 
                                                            onClick={() => window.open(BASE_IMG_URL + imgUrl, '_blank')} 
                                                            title="Ouvrir l'image en grand"
                                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors mb-1"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <span className="text-[9px] font-bold tracking-widest uppercase">Voir en Grand</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-40 bg-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center p-4">
                                                    <AlertCircle size={24} className="text-amber-500 mb-2 opacity-50" />
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Image non disponible</p>
                                                </div>
                                            )}

                                            {decision?.reason && (
                                                <div className="mt-3 p-2 bg-red-100/50 border border-red-200 rounded-lg text-[11px] text-red-700 italic">
                                                    " {decision.reason} "
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* ACTIONS (Boutons au bas de la carte) */}
                            <div className="p-4 border-t border-slate-100 bg-white">
                                {(() => {
                                    const allItemsDecided = order.items.every((item: any) => {
                                        // On vérifie si l'article est personnalisable
                                        let designData: any = null;
                                        try {
                                            if (item.customization) {
                                                designData = typeof item.customization === 'string' 
                                                    ? JSON.parse(item.customization) 
                                                    : item.customization;
                                            }
                                        } catch (e) {}
                                        
                                        const isCustom = !!(designData?.customizationImage || (designData?.elements && designData.elements.length > 0));
                                        
                                        // Si pas personnalisable, c'est OK par défaut
                                        if (!isCustom) return true;
                                        
                                        // Si personnalisable, il faut soit qu'il soit déjà validé, soit qu'une nouvelle décision soit prise
                                        return ['Validé', 'approved'].includes(item.design_status) || !!itemDecisions[item.id];
                                    });
                                    
                                    return (
                                        <button 
                                            onClick={() => handleFinalSubmit(order)}
                                            disabled={processingId === order.id || !allItemsDecided}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale theme-bg-primary"
                                        >
                                            {processingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                            Confirmer ma décision
                                        </button>
                                    );
                                })()}
                                <p className="text-[10px] text-center text-slate-400 mt-3 italic">
                                    Vérifiez bien chaque item avant de confirmer.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};