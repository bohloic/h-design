import React, { useEffect, useState } from 'react';
import { authFetch } from '@/src/utils/apiClient';
import { formatCurrency } from '@/constants';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { CheckCircle, XCircle, Palette, Eye, Loader2, AlertCircle, PackageX } from 'lucide-react';

export const AdminValidationDesigns = () => {
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // 1. CHARGEMENT DES COMMANDES EN ATTENTE DE DESIGN
    const fetchPendingDesigns = async () => {
        try {
            setLoading(true);
            const response = await authFetch('/api/admin/orders'); 
            const allOrders = await response.json();
            
            // On filtre uniquement celles qui attendent une validation
            const waiting = allOrders.filter((o: any) => o.status === 'paid_waiting_validation');
            setPendingOrders(waiting);
        } catch (error) {
            console.error("Erreur chargement des designs :", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingDesigns();
    }, []);

    // 2. ACTION : APPROUVER LE DESIGN
    const handleApprove = async (orderId: number) => {
        if (!window.confirm("Valider ce design et lancer la préparation ?")) return;
        
        try {
            setProcessingId(orderId);
            const response = await authFetch(`/api/admin/orders/${orderId}/validate-design`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' })
            });

            if (response.ok) {
                setPendingOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                alert("Erreur lors de l'approbation.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    // 3. ACTION : REJETER LE DESIGN
    const handleReject = async (orderId: number) => {
        const reason = window.prompt("Motif du rejet (ex: Image de mauvaise qualité, Contenu inapproprié...) :");
        if (!reason) return; 

        try {
            setProcessingId(orderId);
            const response = await authFetch(`/api/admin/orders/${orderId}/validate-design`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', reason })
            });

            if (response.ok) {
                setPendingOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                alert("Erreur lors du rejet.");
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
                                <span className="text-xs font-bold bg-fuchsia-100 text-fuchsia-700 px-3 py-1.5 rounded-full">
                                    {formatCurrency(order.total_amount)}
                                </span>
                            </div>

                            {/* CONTENU (Articles & Designs) */}
                            <div className="p-5 flex-1 space-y-4">
                                {/* GESTION D'ERREUR SI L'API NE RENVOIE PAS LES ARTICLES */}
                                {(!order.items || order.items.length === 0) && (
                                    <div className="text-center py-4 text-amber-500 flex flex-col items-center">
                                        <PackageX size={32} className="opacity-50 mb-2" />
                                        <p className="text-sm font-bold">Aucun détail d'article reçu.</p>
                                        <p className="text-xs text-slate-400 mt-1">Vérifiez que votre API inclut les articles de la commande.</p>
                                    </div>
                                )}

                                {order.items?.map((item: any, idx: number) => {
                                    // Extraction robuste du design
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

                                    // Recherche intelligente de l'image (selon comment elle est stockée)
                                    const imgUrl = designData?.customizationImage || designData?.image || null;

                                    return (
                                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                                            <p className="font-bold text-sm text-slate-800 line-clamp-1 mb-3 pr-8">{item.name || 'Article personnalisé'}</p>
                                            <span className="absolute top-4 right-4 text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">x{item.quantity}</span>
                                            
                                            {designData ? (
                                                <div className="space-y-3">
                                                    {/* AFFICHAGE DE L'IMAGE (Si trouvée) */}
                                                    {imgUrl ? (
                                                        <a href={imgUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                            <img src={BASE_IMG_URL + imgUrl} alt="Design client" className="w-full h-40 object-contain p-2 group-hover:scale-105 transition-transform" />
                                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                                                <Eye size={28} className="mb-2" />
                                                                <span className="text-xs font-bold tracking-widest uppercase">Agrandir</span>
                                                            </div>
                                                        </a>
                                                    ) : (
                                                        /* AFFICHAGE DES DONNÉES BRUTES SI PAS D'IMAGE */
                                                        <div className="bg-slate-900 p-3 rounded-xl overflow-auto max-h-32">
                                                            <p className="text-[10px] text-fuchsia-400 font-bold mb-1 uppercase tracking-widest">Données brutes du design</p>
                                                            <pre className="text-xs text-slate-300 font-mono">
                                                                {JSON.stringify(designData, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {/* AFFICHAGE DU TEXTE PERSONNALISÉ (Si présent) */}
                                                    {designData.text && (
                                                        <div className="bg-white p-3 rounded-xl text-sm border border-slate-200 shadow-sm">
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Texte à imprimer :</p>
                                                            <p className="font-black text-slate-800">"{designData.text}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 bg-white p-3 rounded-xl border border-slate-100">
                                                    <AlertCircle size={16}/> 
                                                    <span className="text-xs italic">Aucune donnée de personnalisation détectée.</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* ACTIONS (Boutons au bas de la carte) */}
                            <div className="p-4 border-t border-slate-100 bg-white flex gap-3">
                                <button 
                                    onClick={() => handleReject(order.id)}
                                    disabled={processingId === order.id}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 active:scale-95"
                                >
                                    <XCircle size={18} /> Rejeter
                                </button>
                                <button 
                                    onClick={() => handleApprove(order.id)}
                                    disabled={processingId === order.id}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 active:scale-95"
                                >
                                    {processingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    Approuver
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};