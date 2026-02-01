import React, { useEffect, useState } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reference = searchParams.get('reference'); 
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (reference) {
            verifyTransaction(reference);
        }
    }, [reference]);

    const verifyTransaction = async (ref: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await authFetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reference: ref })
            });

            const data = await res.json();

            if (data.success) {
                // 👇 C'EST ICI QU'ON VIDE LE PANIER 👇
                // Supprimez la clé qui contient votre panier (vérifiez le nom dans Application > LocalStorage)
                localStorage.removeItem('cart'); // Au cas où
                
                // Petite astuce pour forcer la mise à jour du compteur dans le Header si vous utilisez un écouteur d'événement
                window.dispatchEvent(new Event("cartUpdated"));

                setStatus('success');
                
                setTimeout(() => {
                    alert("Paiement validé ! Un lutin livreur prépare votre commande 🎅");
                    navigate('/order-confirmed', { 
                        state: { orderId: data.orderId } 
                    });
                }, 1000);

            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
            {status === 'loading' && (
                <>
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">Vérification du paiement...</h2>
                    <p className="text-slate-400 text-sm mt-2">Ne fermez pas cette page.</p>
                </>
            )}
            
            {status === 'success' && (
                <div className="animate-bounce-in">
                    <CheckCircle className="w-20 h-20 text-green-600 mb-4 mx-auto" />
                    <h2 className="text-2xl font-black text-green-700">Paiement Réussi !</h2>
                    <p className="text-slate-500 mt-2">Panier vidé et commande validée.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="animate-in fade-in zoom-in">
                    <XCircle className="w-20 h-20 text-red-600 mb-4 mx-auto" />
                    <h2 className="text-2xl font-black text-red-700">Paiement Échoué</h2>
                    <p className="text-slate-500 mt-2">La transaction n'a pas pu être validée.</p>
                    <button 
                        onClick={() => navigate('/checkout')} 
                        className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                    >
                        Réessayer le paiement
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentCallback;