import React, { useEffect, useState } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, Download, Phone, ShoppingBag, Clock, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/constants';
import { authFetch } from '@/src/utils/apiClient';
import { useAutoRefresh } from '@/src/utils/hooks/useAutoRefresh';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { useParams, useNavigate } from 'react-router-dom';
import { translateStatus, getStatusColorClass } from '@/src/utils/statusTranslations';

export const OrderDetails: React.FC = () => {
    const { id: orderSlug } = useParams();
    const navigate = useNavigate();
    
    // Extrait l'ID réel depuis le slug (ex: HD-00123 -> 123)
    const orderId = orderSlug?.replace('HD-', '');
    
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

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
            alert("Impossible de télécharger la facture pour le moment.");
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

    if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Chargement des détails de la commande {orderSlug}...</div>;
    if (!order) return <div className="p-12 text-center text-red-500">Commande introuvable.</div>;



    const translatedStatus = translateStatus(order.status);
    const isCancelled = translatedStatus === 'Annulé';
    const isPending = order.status.toLowerCase() === 'pending';

    // --- LOGIQUE DE LA BARRE DE PROGRESSION ---
    const steps = ['Payé', 'En préparation', 'Expédié', 'Livré'];
    let currentStepIndex = -1;
    if (order.status.toLowerCase() === 'paid') currentStepIndex = 0;
    if (order.status.toLowerCase() === 'processing') currentStepIndex = 1;
    if (order.status.toLowerCase() === 'shipped') currentStepIndex = 2;
    if (order.status.toLowerCase() === 'delivered') currentStepIndex = 3;
    
    
    // Calcul de la progression (en %)
    let progressPercentage = 0;
    if (isCancelled || isPending) {
        progressPercentage = 0; // Barre vide si annulé ou en attente de paiement
    } else if (currentStepIndex !== -1) {
        progressPercentage = (currentStepIndex / (steps.length - 1)) * 100;
    } else {
        progressPercentage = 100; // Sécurité si statut inconnu "terminé"
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* EN-TÊTE & RETOUR */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard/orders')}
                        className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                            Commande #{orderSlug}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
                
                {/* BOUTON FACTURE */}
                <button 
                    onClick={handleDownloadInvoice}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md hover-theme-bg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'white', color: 'var(--theme-primary)', border: '2px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
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
                        <p className="text-sm text-slate-500 mt-2 text-center">Votre commande passera en préparation dès réception du paiement.</p>
                    </div>
                ) : (
                    <div className="relative flex justify-between items-center max-w-3xl mx-auto mt-4 px-2 md:px-0">
                        {/* La ligne de fond (grise épaisse) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-slate-100 rounded-full"></div>
                        
                        {/* La ligne de progression (couleur dynamique) */}
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                                width: `${progressPercentage}%`,
                                backgroundColor: 'var(--theme-primary)'
                            }}
                        ></div>

                        {/* Les étapes */}
                        {steps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            
                            return (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                                    <div 
                                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 
                                            ${isCompleted ? 'border-white text-white shadow-lg' : 'border-slate-50 bg-white text-slate-300'}
                                            ${isCurrent ? 'ring-4 ring-offset-2' : ''}
                                        `}
                                        style={{
                                            backgroundColor: isCompleted ? 'var(--theme-primary)' : '',
                                            '--tw-ring-color': isCurrent ? 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' : 'transparent'
                                        } as React.CSSProperties}
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
                                    <img src={item.image_url ? BASE_IMG_URL + item.image_url : '/placeholder.png'} alt={item.name} className="w-full h-full object-contain rounded-xl" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 line-clamp-1">{item.name || 'Création personnalisée'}</h4>
                                    <p className="text-sm text-slate-500 mt-1">Quantité : <span className="font-bold text-slate-700">{item.quantity}</span></p>
                                    <p className="text-lg font-black mt-2" style={{ color: 'var(--theme-primary)' }}>{formatCurrency(item.unit_price || item.price)}</p>
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
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
                        
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Résumé Financier</h3>
                        <div className="space-y-4 text-sm mb-6 relative z-10">
                            <div className="flex justify-between text-slate-300 font-medium">
                                <span>Sous-total articles</span>
                                <span>{formatCurrency(order.total_amount - (order.shipping_fee || 0))}</span>
                            </div>
                            <div className="flex justify-between text-slate-300 font-medium">
                                <span>Frais de livraison</span>
                                <span>{formatCurrency(order.shipping_fee || 0)}</span>
                            </div>
                        </div>
                        <div className="pt-5 border-t border-slate-700/50 flex justify-between items-end relative z-10">
                            <span className="font-bold text-slate-300 uppercase tracking-widest text-xs">Total Payé</span>
                            <span className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-primary)' }}>
                                {formatCurrency(order.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🪄 STYLES HOVER/FOCUS */}
            <style>{`
                .hover-theme-bg:hover {
                    background-color: var(--theme-primary) !important;
                    color: white !important;
                    border-color: var(--theme-primary) !important;
                }
            `}</style>
        </div>
    );
};