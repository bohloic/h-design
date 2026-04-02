import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../src/utils/apiClient';
import { useAutoRefresh } from '../../src/utils/hooks/useAutoRefresh';
import {
    ChevronLeft, Package, User, MapPin, CreditCard,
    Calendar, Printer, Mail, Phone, Shirt, Palette, Loader2, Sparkles, AlertTriangle, Type, Image as ImageIcon, Move, RotateCw, Maximize, Download, Eye,
    ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { AdminDesignPreview } from '@/src/components/admin/AdminDesignPreview';
import { translateStatus, getStatusColorClass, OrderStatus } from '../../src/utils/statusTranslations';



export const OrderDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [validating, setValidating] = useState(false);
    const [designerMessage, setDesignerMessage] = useState("");

    const fetchOrderDetails = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await authFetch(`/api/orders/${id}`);
            if (!response || !response.ok) throw new Error("Erreur chargement");
            const data = await response.json();

            // 🪄 On normalise le statut dès la réception !
            // On s'assure que le statut est reconnu par notre utilitaire
            data.status = data.status || OrderStatus.PENDING;

            setOrder(data);
            if (data.admin_notes) setDesignerMessage(data.admin_notes); // Si tu stockes les notes dans admin_notes
        } catch (error) {
            console.error(error);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails(true);
    }, [id, navigate]);

    useAutoRefresh(() => {
        if (id) fetchOrderDetails(false);
    }, 10000);

    const handleDesignValidation = async (decision: 'approve' | 'reject') => {
        if (!window.confirm(`Confirmer le ${decision === 'approve' ? 'succès' : 'refus'} du design ?`)) return;

        // Sécurité : obliger un motif si refus
        if (decision === 'reject' && !designerMessage.trim()) {
            alert("Veuillez saisir un message pour expliquer le refus au client.");
            return;
        }

        setValidating(true);
        try {
            // 🪄 Envoi avec les bons noms de variables pour ton Backend (action & reason)
            const response = await authFetch(`/api/admin/orders/${id}/validate-design`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: decision, reason: designerMessage })
            });

            if (response.ok) {
                await fetchOrderDetails();
                alert(decision === 'approve' ? "Design validé avec succès ! Commande en préparation." : "Design refusé, la commande nécessite une action du client.");
                setDesignerMessage(""); // On vide le message après succès
            } else {
                alert("Erreur lors de la validation technique.");
            }
        } catch (error) {
            alert("Erreur serveur.");
        } finally {
            setValidating(false);
        }
    };

    if (loading || !order) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--theme-primary)' }} />
            </div>
        );
    }

    const subTotal = order.items?.reduce((acc: number, item: any) => acc + (parseFloat(item.unit_price || item.price) * item.quantity), 0) || 0;
    const totalOrderAmount = parseFloat(order.total_amount);
    const shippingCost = Math.max(0, totalOrderAmount - subTotal);

    const getCleanUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const cleanPath = path.replace('//', '/').replace('/images/', '').replace('images/', '');
        const baseUrl = BASE_IMG_URL.endsWith('/') ? BASE_IMG_URL : BASE_IMG_URL + '/';
        return `${baseUrl}${cleanPath}`;
    };

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 bg-slate-50 min-h-screen">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <button onClick={() => navigate(-1)} className="hover-theme-text flex items-center gap-2 text-slate-500 transition-colors mb-2 text-sm font-bold">
                        <ChevronLeft size={16} /> Retour
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Commande #HD-{String(order.id).padStart(5, '0')}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColorClass(order.status)}`}>
                            {translateStatus(order.status)}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="hover-theme-border bg-white border-2 border-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                    <Printer size={18} /> <span className="hidden sm:inline">Imprimer</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2 space-y-6">

                    {/* MODULE DE VALIDATION DESIGNER */}
                    {/* 🪄 N'apparaît que si payé ET en attente de validation */}
                    {order.status === OrderStatus.PAID_WAITING_VALIDATION && (
                        <div className="bg-white border-2 border-fuchsia-200 rounded-3xl p-6 shadow-xl shadow-fuchsia-50 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase">Contrôle Créatif Designer</h3>
                                    <p className="text-sm text-slate-500">Approuvez ou refusez les personnalisations demandées.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                                    <MessageSquare size={14} /> Note / Motif (Obligatoire si refus)
                                </label>
                                <textarea
                                    value={designerMessage}
                                    onChange={(e) => setDesignerMessage(e.target.value)}
                                    placeholder="Ex: 'Design recentré pour une meilleure impression' ou 'L'image est trop floue'..."
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-50 outline-none text-sm min-h-[100px] transition-all"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleDesignValidation('approve')}
                                        disabled={validating}
                                        style={{ backgroundColor: 'var(--theme-primary)' }}
                                        className="flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-bold shadow-lg opacity-95 hover:opacity-100 transition-opacity disabled:opacity-50"
                                    >
                                        {validating ? <Loader2 className="animate-spin" size={20} /> : <ThumbsUp size={20} />}
                                        Valider
                                    </button>

                                    <button
                                        onClick={() => handleDesignValidation('reject')}
                                        disabled={validating}
                                        className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 border border-red-100"
                                    >
                                        <ThumbsDown size={20} />
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Package style={{ color: 'var(--theme-primary)' }} /> Articles commandés ({order.items?.length || 0})
                            </h3>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {order.items?.map((item: any) => {
                                let isCustom = false;
                                let maquetteUrl: string | null = null;
                                let elements: any[] = [];

                                let rawData = item.customization || item.design;

                                if (rawData) {
                                    try {
                                        let parsed = rawData;
                                        while (typeof parsed === 'string') {
                                            const prev = parsed;
                                            try {
                                                parsed = JSON.parse(parsed);
                                                if (parsed === prev) break;
                                            } catch (e) { break; }
                                        }

                                        if (parsed && typeof parsed === 'object') {
                                            isCustom = true;
                                            if (Array.isArray(parsed)) {
                                                elements = parsed;
                                            } else {
                                                elements = parsed.elements || parsed.design || [];
                                                const rawUrl = parsed.customizationImage || parsed.imageUrl || parsed.previewUrl;
                                                if (rawUrl) maquetteUrl = getCleanUrl(rawUrl);
                                            }
                                        }
                                    } catch (e) { console.error("Erreur parsing:", e); }
                                }

                                let thumbnailSrc = item.image_url ? BASE_IMG_URL + item.image_url : '/placeholder.png';
                                if (maquetteUrl) {
                                    thumbnailSrc = maquetteUrl;
                                } else if (isCustom && item.image_url) {
                                    // 🪄 FALLBACK : Si c'est du perso mais pas de maquette (ancien), on montre le produit brut
                                    thumbnailSrc = BASE_IMG_URL + item.image_url;
                                }

                                return (
                                    <div key={item.id} className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 relative group">
                                                <img src={thumbnailSrc} alt={item.name || item.product_name} className="w-full h-full object-contain" />
                                                {isCustom && <span className="absolute top-1 right-1 text-[8px] font-bold text-white bg-fuchsia-600 px-1.5 py-0.5 rounded-full shadow-sm">CUSTOM</span>}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg">{item.name || item.product_name}</h4>
                                                        <p className="text-xs text-slate-400">Réf: {item.product_id}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900">{((item.unit_price || item.price) * item.quantity).toLocaleString('fr-FR')} FCFA</p>
                                                        <p className="text-xs text-slate-500">x{item.quantity}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {item.size && <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-100 flex items-center gap-1"><Shirt size={12} className="text-slate-400" /> Taille : {item.size}</span>}
                                                    {item.color && <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-100 flex items-center gap-2"><Palette size={12} className="text-slate-400" /> Couleur : <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: item.color }}></span> {item.color}</span>}
                                                </div>

                                                {/* DÉTAILS DE LA PERSONNALISATION */}
                                                {isCustom && (
                                                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 border-dashed mt-4 space-y-6">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                                                <Eye size={14} style={{ color: 'var(--theme-primary)' }} /> 1. Maquette Visuelle
                                                            </p>
                                                            {maquetteUrl ? (
                                                                <div className="flex flex-col items-start gap-2">
                                                                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm inline-block">
                                                                        <img src={maquetteUrl} alt="Maquette Finale" className="max-w-full h-auto max-h-[300px] object-contain rounded" />
                                                                    </div>
                                                                    <a href={maquetteUrl} download={`maquette-${order.id}-${item.id}.png`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-2 text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"><Download size={14} /> Télécharger la maquette</a>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100 flex items-center gap-2"><AlertTriangle size={14} /><span>Image de maquette non disponible.</span></div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 border-b border-slate-200 pb-2"><Download size={14} className="text-blue-600" /> 2. Fichiers Sources (HD)</p>
                                                            <AdminDesignPreview
                                                                productImage={item.image_url}
                                                                customizationJson={JSON.stringify(elements)}
                                                            />
                                                        </div>

                                                        {elements.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 border-b border-slate-200 pb-2"><Sparkles size={14} className="text-purple-600" /> 3. Données Techniques</p>
                                                                <div className="space-y-2">
                                                                    {elements.map((el: any, i: number) => (
                                                                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-wrap gap-2 items-center text-xs text-slate-600">
                                                                            <span className="font-bold bg-slate-100 px-2 py-1 rounded text-slate-800 flex items-center gap-1">{el.type === 'text' ? <Type size={10} /> : <ImageIcon size={10} />} {el.type === 'text' ? 'Texte' : 'Image'}</span>
                                                                            {el.type === 'text' && <span className="font-mono bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">"{el.content}"</span>}
                                                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Move size={10} /> X:{Math.round(el.x)} Y:{Math.round(el.y)}</span>
                                                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Maximize size={10} /> L:{Math.round(el.width)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-slate-50 p-6 border-t border-slate-100">
                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex justify-between w-full md:w-72 text-sm text-slate-500"><span>Sous-total</span><span>{subTotal.toLocaleString('fr-FR')} FCFA</span></div>
                                <div className="flex justify-between w-full md:w-72 text-sm text-slate-500"><span>Livraison</span><span className={shippingCost > 0 ? "text-slate-800" : "text-green-600 font-bold"}>{shippingCost > 0 ? `${shippingCost.toLocaleString('fr-FR')} FCFA` : "Gratuite"}</span></div>
                                <div className="w-full md:w-72 border-t border-slate-200 my-2"></div>
                                <div className="flex justify-between w-full md:w-72 text-xl font-black text-slate-900">
                                    <span>Total</span>
                                    <span style={{ color: 'var(--theme-primary)' }}>{totalOrderAmount.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                            <User style={{ color: 'var(--theme-primary)' }} size={20} /> Client
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-sm"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                                    color: 'var(--theme-primary)',
                                    borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                                }}
                            >
                                {(order.prenom || order.customer_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">{order.prenom ? `${order.prenom} ${order.nom}` : order.customer_name}</p>
                                <p className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded inline-block">ID: #{order.user_id || 'Invité'}</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3 text-slate-600 group">
                                <div className="p-2 bg-slate-50 rounded-lg transition-colors group-hover-theme">
                                    <Mail size={18} />
                                </div>
                                <a href={`mailto:${order.email || order.customer_email}`} className="hover-theme-text transition-colors font-medium truncate">{order.email || order.customer_email || 'Non renseigné'}</a>
                            </div>
                            {(order.phone || order.customer_phone) && (
                                <div className="flex items-center gap-3 text-slate-600 group">
                                    <div className="p-2 bg-slate-50 rounded-lg transition-colors group-hover-theme">
                                        <Phone size={18} />
                                    </div>
                                    <span className="font-medium">{order.phone || order.customer_phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                            <MapPin style={{ color: 'var(--theme-primary)' }} size={20} /> Livraison
                        </h3>
                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {order.shipping_address ? <p className="font-medium">{order.shipping_address}</p> : <span className="italic text-slate-400 flex items-center gap-2"><AlertTriangle size={14} /> Adresse non renseignée</span>}
                            <p className="mt-1 text-xs text-slate-400 uppercase tracking-wide">Abidjan, Côte d'Ivoire</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                            <CreditCard style={{ color: 'var(--theme-primary)' }} size={20} /> Paiement
                        </h3>
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold">
                            <span className="text-slate-500">Statut</span>
                            <span className={order.status === OrderStatus.PENDING || order.status === OrderStatus.WAITING_VALIDATION ? 'text-amber-600' : 'text-green-600'}>
                                {order.status === OrderStatus.PENDING || order.status === OrderStatus.WAITING_VALIDATION ? 'EN ATTENTE ⏳' : 'PAYÉ ✅'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🪄 STYLE MAGIQUE POUR LES HOVERS DYNAMIQUES */}
            <style>{`
                .hover-theme-text:hover { color: var(--theme-primary) !important; }
                .hover-theme-border:hover { 
                    border-color: color-mix(in srgb, var(--theme-primary) 30%, transparent) !important; 
                    color: var(--theme-primary) !important; 
                }
                .group:hover .group-hover-theme { 
                    background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent) !important; 
                    color: var(--theme-primary) !important; 
                }
            `}</style>
        </div>
    );
};