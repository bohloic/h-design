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
                localStorage.removeItem('cart'); 
                
                // Forcer la mise à jour du compteur dans le Header
                window.dispatchEvent(new Event("cartUpdated"));

                setStatus('success');
                
                setTimeout(() => {
                    alert("Paiement validé ! Votre commande est en préparation.");
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
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-carbon transition-colors">
            {status === 'loading' && (
                <>
                    {/* 🪄 LOADER DYNAMIQUE */}
                    <Loader2 
                        className="w-16 h-16 animate-spin mb-4" 
                        style={{ color: 'var(--theme-primary)' }} 
                    />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-pure">Vérification du paiement...</h2>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Ne fermez pas cette page.</p>
                </>
            )}
            
            {status === 'success' && (
                <div className="animate-bounce-in">
                    {/* On garde le vert sémantique pour le succès */}
                    <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-500 mb-4 mx-auto" />
                    <h2 className="text-2xl font-black text-green-700 dark:text-green-400">Paiement Réussi !</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Panier vidé et commande validée.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="animate-in fade-in zoom-in">
                    {/* On garde le rouge sémantique pour l'erreur */}
                    <XCircle className="w-20 h-20 text-red-600 dark:text-red-500 mb-4 mx-auto" />
                    <h2 className="text-2xl font-black text-red-700 dark:text-red-400">Paiement Échoué</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">La transaction n'a pas pu être validée.</p>
                    
                    {/* 🪄 BOUTON RÉESSAYER DYNAMIQUE */}
                    <button 
                        onClick={() => navigate('/checkout')} 
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                        className="mt-6 text-white px-6 py-3 rounded-xl font-bold shadow-lg opacity-95 hover:opacity-100 transition-all active:scale-95"
                    >
                        Réessayer le paiement
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentCallback;