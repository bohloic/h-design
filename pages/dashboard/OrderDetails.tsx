import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, Download, Phone, ShoppingBag, Clock, XCircle, Loader2, Palette, AlertTriangle, CreditCard } from 'lucide-react';
import { useToast } from '@/src/utils/context/ToastContext';
import { formatCurrency } from '@/constants';
import { authFetch } from '@/src/utils/apiClient';
import { useAutoRefresh } from '@/src/utils/hooks/useAutoRefresh';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { useParams, useNavigate } from 'react-router-dom';
import { translateStatus, getStatusColorClass } from '@/src/utils/statusTranslations';

export const OrderDetails: React.FC = () => {
    const { showToast } = useToast();
    const { id: orderSlug } = useParams();
    const navigate = useNavigate();
    
    // Extrait l'ID réel depuis le slug (ex: HD-00123 -> 123)
    const orderId = orderSlug?.replace('HD-', '');
    
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const handleCancelOrder = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?\n\n⚠️ IMPORTANT : Aucun remboursement ne sera autorisé après l'annulation d'une commande déjà payée.")) {
            return;
        }

        try {
            const response = await authFetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT'
            });

            if (response.ok) {
                showToast("Votre commande a été annulée.", "success");
                fetchOrderDetails(); // Rafraîchir l'affichage
            } else {
                const data = await response.json();
                showToast(data.message || "Erreur lors de l'annulation", "error");
            }
        } catch (error) {
            console.error("Erreur annulation:", error);
            showToast("Impossible d'annuler la commande pour le moment.", "error");
        }
    };

    const handlePayNow = async () => {
        if (!order) return;
        setIsPaying(true);
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
            setIsPaying(false);
        }
    };



    const handleDownloadInvoice = async () => {
        try {
            setIsDownloading(true);
            
            // ⚠️ Remplace l'URL par la vraie route de ton backend qui génère le PDF
            const response = await authFetch(`/api/orders/${orderId}/invoice`); 
            
            if (!response.ok) throw new Error("Erreur lors du téléchargement");

            // 🪄 1. On transforme la réponse en "Blob" (fichier binaire PDF)
            const blob = await response.blob();
            
            // 🪄 2. On crée un lien virtuel caché dans le navigateur
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // 🪄 3. On lui donne le nom officiel du fichier
            link.setAttribute('download', `Facture_${orderSlug}.pdf`);
            
            // 🪄 4. On simule un clic sur ce lien pour lancer le téléchargement
            document.body.appendChild(link);
            link.click();
            
            // 🪄 5. On nettoie les traces
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error("Erreur de téléchargement :", error);
            showToast("Impossible de télécharger la facture pour le moment.", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    const fetchOrderDetails = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await authFetch(`/api/orders/${orderId}`);
            if (response.ok) {
                setOrder(await response.json());
            }
        } catch (error) {
            console.error("Erreur lors du chargement des détails :", error);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails(true);
    }, [orderId]);

    useAutoRefresh(() => {
        if (orderId) fetchOrderDetails(false);
    }, 10000);

    const status = order?.status?.toLowerCase() || '';
    const translatedStatus = order ? translateStatus(order.status) : '';
    const isCancelled = status.includes('annulé') || status === 'cancelled';
    const isPending = status.includes('en attente de paiement') || status === 'pending';

    // --- LOGIQUE DE LA BARRE DE PROGRESSION ---
    const steps = ['Paiement', 'Préparation', 'Expédition', 'Livré'];
    let currentStepIndex = -1;
    
    if (status.includes('payé') || status === 'paid') currentStepIndex = 0;
    if (status.includes('en préparation') || status === 'processing') currentStepIndex = 1;
    if (status.includes('expédié') || status === 'shipped') currentStepIndex = 2;
    if (status.includes('livré') || status === 'delivered') currentStepIndex = 3;
    
    // Calcul de la progression (en %)
    let progressPercentage = 0;
    if (isCancelled || isPending || status.includes('validation')) {
        progressPercentage = 0; 
    } else if (currentStepIndex !== -1) {
        progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
    } else {
        progressPercentage = 100;
    }

    useLayoutEffect(() => {
        if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progressPercentage}%`;
        }
    }, [progressPercentage]);

    if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Chargement des détails de la commande {orderSlug}...</div>;
    if (!order) return <div className="p-12 text-center text-red-500">Commande introuvable.</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* EN-TÊTE & RETOUR */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard/orders')}
                        className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                        title="Retour aux commandes"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                            Commande #{orderSlug}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                
                {/* BOUTON FACTURE */}
                <button 
                    onClick={handleDownloadInvoice}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md hover-theme-bg disabled:opacity-50 disabled:cursor-not-allowed bg-white text-theme-primary border-2 border-theme-primary/20"
                >
                    {isDownloading ? (
                        <><Loader2 size={18} className="animate-spin" /> Génération...</>
                    ) : (
                        <><Download size={18} /> Télécharger la facture</>
                    )}
                </button>
            </div>

            {/* BARRE DE SUIVI (TRACKING) */}
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Suivi de livraison</h3>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColorClass(order.status)}`}>
                        {translateStatus(order.status)}
                    </span>
                </div>
                
                {isCancelled ? (
                    <div className="flex flex-col items-center justify-center py-6 text-red-500">
                        <XCircle size={48} className="mb-3 opacity-50" />
                        <p className="font-bold text-lg">Cette commande a été annulée.</p>
                    </div>
                ) : isPending ? (
                    <div className="flex flex-col items-center justify-center py-6 text-amber-500">
                        <Clock size={48} className="mb-3 opacity-50 animate-pulse" />
                        <p className="font-bold text-lg">En attente de confirmation de paiement.</p>
                        <p className="text-sm text-slate-500 mt-2 mb-6 text-center">Votre commande passera en préparation dès réception du paiement.</p>
                        
                        <button 
                            onClick={handlePayNow}
                            disabled={isPaying}
                            className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 disabled:opacity-50"
                        >
                            {isPaying ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                            {isPaying ? 'Initialisation...' : 'Payer maintenant ✅'}
                        </button>
                    </div>
                ) : (
                    <div className="relative flex justify-between items-center max-w-3xl mx-auto mt-4 px-2 md:px-0">
                        {/* La ligne de fond (grise épaisse) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-slate-100 rounded-full"></div>
                        
                        {/* La ligne de progression (couleur dynamique) */}
                        <div 
                            ref={progressBarRef}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-1000 ease-out bg-theme-primary"
                        ></div>

                        {/* Les étapes */}
                        {steps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            
                            return (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                                    <div 
                                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 
                                            ${isCompleted ? 'bg-[var(--theme-primary)] border-white text-white shadow-lg' : 'bg-white border-slate-50 text-slate-300'}
                                            ${isCurrent ? 'ring-4 ring-[color-mix(in_srgb,var(--theme-primary),transparent_70%)] ring-offset-2' : ''}
                                        `}
                                    >
                                        {index === 0 && <ShoppingBag size={20} />}
                                        {index === 1 && <Package size={20} />}
                                        {index === 2 && <Truck size={20} className={isCurrent ? "animate-bounce" : ""} />}
                                        {index === 3 && <CheckCircle2 size={24} />}
                                    </div>
                                    <span className={`text-[10px] md:text-sm font-bold absolute top-16 whitespace-nowrap transition-colors duration-300 ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="mt-16 text-center">
                    <p className="text-sm text-slate-500 italic">
                        {translatedStatus === 'Livré' ? "Votre colis a été livré. Merci de votre confiance !" : "Les délais de livraison varient selon votre zone."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LISTE DES ARTICLES */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-slate-400" /> Articles commandés
                    </h3>
                    <div className="space-y-4 divide-y divide-slate-100">
                        {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="pt-4 first:pt-0 flex items-center gap-4">
                                <div className="w-20 h-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 p-1">
                                    {(() => {
                                        let displayImage = item.image_url;
                                        try {
                                            const design = typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization;
                                            if (design?.customizationImage) displayImage = design.customizationImage;
                                        } catch (e) {}
                                        
                                        return (
                                            <img 
                                                src={(() => {
                                                    if (!displayImage) return "/placeholder.png";
                                                    if (displayImage.startsWith('data:') || displayImage.startsWith('http')) return displayImage;
                                                    return BASE_IMG_URL + displayImage;
                                                })()} 
                                                alt={item.name} 
                                                className="w-full h-full object-contain rounded-xl" 
                                            />
                                        );
                                    })()}
                                </div>
                                <div className="flex-1">
                                    {/* BADGE TYPE PRODUIT */}
                                    <div className="mb-1">
                                        {item.customization ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">
                                                <Palette size={10} /> Personnalisé
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                                                <Package size={10} /> Standard
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800 line-clamp-1">
                                            {item.customization ? (item.name || 'Création personnalisée') : (item.product_name || item.name)}
                                        </h4>
                                        <p className="text-sm font-black text-theme-primary">{formatCurrency(item.unit_price || item.price)}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Quantité : <span className="font-bold text-slate-700">{item.quantity}</span></p>
                                    <div className="flex gap-4">
                                        <p className="text-xs text-slate-500 mt-1">Taille : <span className="font-bold text-slate-700">{item.size || 'Unique'}</span></p>
                                        {item.color && (
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                Couleur : <span className="font-bold text-slate-700 uppercase">{item.color}</span>
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* STATUS DU DESIGN PAR ARTICLE (Uniquement si personnalisé) */}
                                    {item.customization && (
                                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                                            {['Validé', 'approved'].includes(item.design_status) ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                                    <CheckCircle2 size={12} /> Design Validé
                                                </span>
                                            ) : ['Refusé', 'rejected'].includes(item.design_status) ? (
                                                <>
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                                                        <AlertTriangle size={12} /> Action Requise
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            const customization = typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization;
                                                            // 🪄 On récupère la variante et la couleur pour que le customizer s'ouvre sur le même produit
                                                            const variantId = item.variant_id || customization?.options?.variant_info?.id || customization?.variantId;
                                                            const colorName = item.color || customization?.options?.color || item.color;
                                                            const sizeName = item.size || customization?.options?.size || item.size;
    
                                                            navigate('/personnaliser/mon-design', { 
                                                                state: { 
                                                                    productId: item.product_id, 
                                                                    variantId: variantId,
                                                                    colorName: colorName,
                                                                    sizeName: sizeName, // On passe la taille pour qu'elle soit présélectionnée
                                                                    orderItemId: item.id,
                                                                    isEdit: true,
                                                                    existingDesign: customization
                                                                } 
                                                            });
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                                                    >
                                                        <Palette size={12} /> Modifier mon design
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                                    <Clock size={12} /> En attente de validation
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {['Refusé', 'rejected'].includes(item.design_status) && item.rejection_reason && (
                                        <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-400 rounded-r-lg text-[10px] text-red-700 italic">
                                            Motif : "{item.rejection_reason}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RÉSUMÉ ET ADRESSE */}
                <div className="space-y-6">
                    {/* Adresse */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Adresse de Livraison</h3>
                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl">
                            <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                <MapPin size={18} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{order.shipping_address || 'Retrait en atelier'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <Phone size={18} className="text-slate-400 shrink-0" />
                                <span>{order.phone || 'Non renseigné'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                        {/* Décoration d'arrière-plan */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 bg-theme-primary"></div>
                        
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Résumé Financier</h3>
                        <div className="space-y-4 text-sm mb-6 relative z-10">
                            <div className="flex justify-between text-slate-300 font-medium">
                                <span>Sous-total articles</span>
                                <span>{formatCurrency(order.items?.reduce((sum: number, i: any) => sum + (i.unit_price * i.quantity), 0) || 0)}</span>
                            </div>
                            <div className="flex justify-between text-slate-300 font-medium">
                                <span>Frais de livraison</span>
                                <span>{formatCurrency(order.shipping_fee || 0)}</span>
                            </div>
                            {order.points_used > 0 && (
                                <div className="flex justify-between text-amber-400 font-medium">
                                    <span>Récompense Fidélité</span>
                                    <span>- {formatCurrency(order.points_used * 25)}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-5 border-t border-slate-700/50 flex justify-between items-end relative z-10">
                            <span className="font-bold text-slate-300 uppercase tracking-widest text-xs">Total Payé</span>
                            <span className="text-2xl md:text-3xl font-black tracking-tight text-theme-primary">
                                {formatCurrency(order.total_amount)}
                            </span>
                        </div>
                    </div>

                    {/* ✅ BOUTON ANNULATION (Visible uniquement si non expédié/annulé) */}
                    {!order.status.toLowerCase().includes('expédié') && 
                     !order.status.toLowerCase().includes('livré') && 
                     !order.status.toLowerCase().includes('annulé') && (
                        <button 
                            onClick={handleCancelOrder}
                            className="w-full py-4 border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <XCircle size={18} /> Annuler ma commande
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};