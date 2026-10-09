import { useEffect, useState } from 'react';
import { authFetch } from '@/utils/apiClient';
import { useToast } from '@/utils/context/ToastContext';
import { formatCurrency } from '@/constants';
import { BASE_IMG_URL } from '@/components/images/VoirImage';
import SafeImage from '../tools/SafeImage';
import LoadingSpinner from '../tools/LoadingSpinner';
import { CheckCircle, XCircle, Palette, Eye, Loader2, AlertCircle, X, Download, ZoomIn, Layers } from 'lucide-react';
import { useAutoRefresh } from '@/utils/hooks/useAutoRefresh';
import { AdminDesignPreview } from './AdminDesignPreview';

export const AdminValidationDesigns = () => {
    const { showToast } = useToast();
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Modal d'inspection détaillée du design client
    const [previewModalItem, setPreviewModalItem] = useState<{ item: any; imgUrl: string; orderSlug: string } | null>(null);

    // 1. CHARGEMENT DES COMMANDES EN ATTENTE DE DESIGN
    const fetchPendingDesigns = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await authFetch('/api/admin/orders'); 
            if (response.ok) {
                const rawOrders = await response.json();
                const allOrders = (Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders || [])).map((order: any) => {
                    let items = order.items;
                    if (typeof items === 'string') {
                        try { items = JSON.parse(items); } catch(e) { items = []; }
                    }
                    return { ...order, items: Array.isArray(items) ? items : [] };
                });
                
                // 🪄 Filtrage précis : uniquement les commandes valides avec des designs personnalisés en attente de validation (exclut les commandes annulées ou non en règle)
                const filteredPending = allOrders.filter((order: any) => {
                    const statusLower = String(order.status || '').toLowerCase().trim();
                    const paymentStatusLower = String(order.payment_status || order.etat_paiement || order.paymentStatus || '').toLowerCase().trim();

                    // 🛑 EXCLUSION STRICTE DES COMMANDES ANNULÉES, REFUSÉES, ÉCHOUÉES OU NON EN RÈGLE
                    const isCanceledOrNonCompliant = 
                        statusLower.includes('annul') ||
                        statusLower.includes('cancel') ||
                        statusLower.includes('refus') ||
                        statusLower.includes('reject') ||
                        statusLower.includes('echec') ||
                        statusLower.includes('failed') ||
                        statusLower.includes('rembours') ||
                        statusLower.includes('refund') ||
                        statusLower.includes('abandon') ||
                        paymentStatusLower.includes('annul') ||
                        paymentStatusLower.includes('cancel') ||
                        paymentStatusLower.includes('refus') ||
                        paymentStatusLower.includes('reject') ||
                        paymentStatusLower.includes('echec') ||
                        paymentStatusLower.includes('failed');

                    if (isCanceledOrNonCompliant) return false;

                    const isValidationStatus = 
                        statusLower === 'paid_waiting' || 
                        statusLower === 'paid_waiting_validation' ||
                        statusLower === 'waiting_validation' ||
                        statusLower === 'pending_approval' ||
                        statusLower.includes('validation') ||
                        statusLower.includes('valider');

                    const hasUnapprovedCustomItem = order.items?.some((item: any) => {
                        let designData: any = null;
                        try {
                            if (item.customization) {
                                designData = typeof item.customization === 'string' 
                                    ? JSON.parse(item.customization) 
                                    : item.customization;
                            }
                        } catch (e) {}
                        
                        const isCustom = !!(
                            item.customization || 
                            item.design || 
                            item.customization_image ||
                            designData?.customizationImage || 
                            (designData?.elements && designData.elements.length > 0)
                        );
                        
                        const itemStatusLower = String(item.design_status || '').toLowerCase().trim();
                        const isApproved = ['validé', 'approved', 'valide'].includes(itemStatusLower);
                        const isRejected = ['refusé', 'rejected', 'refuse'].includes(itemStatusLower);
                        
                        return isCustom && !isApproved && !isRejected;
                    });

                    return isValidationStatus || hasUnapprovedCustomItem;
                });

                setPendingOrders(filteredPending);
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

    useAutoRefresh(() => {
        fetchPendingDesigns(false);
    }, 20000);

    // ⌨️ FERMETURE MODAL AVEC LA TOUCHE ÉCHAP
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && previewModalItem) {
                setPreviewModalItem(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewModalItem]);

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
            .filter((item: any) => itemDecisions[item.id])
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
            let designData: any = null;
            try {
                if (item.customization) {
                    designData = typeof item.customization === 'string' 
                        ? JSON.parse(item.customization) 
                        : item.customization;
                }
            } catch (e) {}
            
            const isCustom = !!(designData?.customizationImage || (designData?.elements && designData.elements.length > 0));
            return isCustom && !['Validé', 'approved'].includes(item.design_status) && !itemDecisions[item.id];
        }).length;

        if (pendingCount > 0) {
            showToast(`Il reste ${pendingCount} article(s) personnalisable(s) sans décision. Vous devez tous les valider ou refuser avant de confirmer.`, "error");
            return;
        }

        try {
            setProcessingId(order.id);
            const response = await authFetch(`/api/admin/orders/${order.id}/validate-items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decisions: decisionsArray })
            });

            if (response.ok) {
                showToast("✅ Décisions enregistrées !", "success");
                
                setPendingOrders(prev => prev.filter(o => o.id !== order.id));
                
                setItemDecisions(prev => {
                    const next = { ...prev };
                    order.items.forEach((item: any) => delete next[item.id]);
                    return next;
                });

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

    if (loading) return <div className="p-16 flex justify-center items-center"><LoadingSpinner size={80} /></div>;

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
                        <p className="text-slate-500 text-sm">Examinez, testez et validez les créations sur-mesure de vos clients</p>
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
                                                    <SafeImage src={imgUrl} alt={isCustomizable ? "Design client" : "Produit standard"} className="w-full h-40 object-contain p-2" />
                                                    <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm gap-2">
                                                        <button 
                                                            onClick={() => setPreviewModalItem({ item, imgUrl, orderSlug: `HD-${String(order.id).padStart(5, '0')}` })}
                                                            title="Inspecter et tester le design"
                                                            className="px-4 py-2 bg-theme-primary text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform text-xs"
                                                        >
                                                            <Eye size={16} />
                                                            Inspecter & Tester
                                                        </button>
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
                                        let designData: any = null;
                                        try {
                                            if (item.customization) {
                                                designData = typeof item.customization === 'string' 
                                                    ? JSON.parse(item.customization) 
                                                    : item.customization;
                                            }
                                        } catch (e) {}
                                        
                                        const isCustom = !!(designData?.customizationImage || (designData?.elements && designData.elements.length > 0));
                                        if (!isCustom) return true;
                                        return ['Validé', 'approved'].includes(item.design_status) || !!itemDecisions[item.id];
                                    });
                                    
                                    return (
                                        <button 
                                            onClick={() => handleFinalSubmit(order)}
                                            disabled={processingId === order.id || !allItemsDecided}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale theme-bg-primary bg-theme-primary"
                                        >
                                            {processingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                            Confirmer ma décision
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🖼️ MODAL D'INSPECTION & TEST DU DESIGN CLIENT */}
            {previewModalItem && (
                <div 
                    className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewModalItem(null)}
                >
                    <div 
                        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-theme-primary rounded-xl text-white">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Inspection & Test du Design HD</h3>
                                    <p className="text-xs text-slate-400">
                                        Cmd {previewModalItem.orderSlug} • {previewModalItem.item.name || previewModalItem.item.product_name}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPreviewModalItem(null)}
                                title="Fermer (Échap)"
                                aria-label="Fermer la fenêtre"
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer relative z-50 touch-target-44 active:scale-95"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                {/* Visualisation du canvas */}
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                        <ZoomIn size={14} /> Rendu Canvas Client
                                    </p>
                                    <div className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-200">
                                        <SafeImage 
                                            src={previewModalItem.imgUrl} 
                                            alt="Visualisation design" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={() => window.open(previewModalItem.imgUrl.startsWith('http') ? previewModalItem.imgUrl : (previewModalItem.imgUrl.startsWith('h-designer/') ? `https://res.cloudinary.com/dwyx9e7zw/image/upload/${previewModalItem.imgUrl}` : BASE_IMG_URL + previewModalItem.imgUrl), '_blank')}
                                        className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                                    >
                                        <Download size={14} /> Télécharger le rendu HD original
                                    </button>
                                </div>

                                {/* Décomposition des calques et textes */}
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Layers size={14} className="text-theme-primary" /> Calques & Éléments Sources
                                    </p>
                                    <AdminDesignPreview 
                                        productImage={previewModalItem.imgUrl} 
                                        customizationJson={previewModalItem.item.customization} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                                Testez la conformité du design avant impression
                            </span>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        handleItemAction(previewModalItem.item.id, 'rejected');
                                        setPreviewModalItem(null);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-200"
                                >
                                    <XCircle size={16} /> Rejeter ce design
                                </button>
                                <button
                                    onClick={() => {
                                        handleItemAction(previewModalItem.item.id, 'approved');
                                        setPreviewModalItem(null);
                                    }}
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                                >
                                    <CheckCircle size={16} /> Valider ce design
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};