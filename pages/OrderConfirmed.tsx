import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, Sparkles, Home } from 'lucide-react';

const OrderConfirmed = () => {
  const location = useLocation();
  // On récupère les infos passées par le navigate
  const { orderId, transactionId } = location.state || {};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fond décoratif subtil */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 relative z-10 border border-slate-100 animate-fade-in-up">
        
        {/* Icône Succès */}
        <div className="relative inline-block">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-green-100">
                <CheckCircle2 size={48} strokeWidth={3} />
            </div>
            {/* Petites étoiles décoratives */}
            <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={24} />
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Paiement Réussi !</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Merci ! Vos cadeaux sont en préparation dans notre atelier.
          </p>
        </div>

        {/* Bloc Détails */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm space-y-3 text-left">
            {orderId && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500">N° Commande</span>
                    <span className="font-bold text-slate-900">#{orderId}</span>
                </div>
            )}
            
            {transactionId && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Transaction</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">{transactionId}</span>
                </div>
            )}
            
            <p className="text-center text-slate-400 text-xs pt-1">
                Un email de confirmation vient de vous être envoyé.
            </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
            <Link 
              to="/dashboard" 
              className="block w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Package size={20}/>
              Suivre ma commande
            </Link>

            <Link 
              to="/" 
              className="block w-full text-slate-500 py-3 font-semibold hover:text-slate-800 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Home size={16}/>
              Retour à la boutique
            </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmed;