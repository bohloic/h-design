import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, Sparkles, Home, MessageCircle } from 'lucide-react';

const OrderConfirmed = () => {
  const location = useLocation();
  const { orderId, transactionId } = location.state || {};

  const whatsappNumber = "22572322727"; 
  const prefilledMessage = `Bonjour H-designer ! 👕\nJe viens de valider ma commande #HD-${String(orderId).padStart(5, '0') || '...'}.\n${transactionId ? `Ma référence de transaction est : ${transactionId}.\n` : ''}Pouvez-vous me confirmer la réception de mon design ?`;
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 🪄 FOND DÉCORATIF SUBTIL DYNAMIQUE */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          ></div>
          <div 
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          ></div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 relative z-10 border border-slate-100 animate-fade-in-up">
        
        {/* L'icône succès reste verte ! (sémantique) */}
        <div className="relative inline-block">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-green-100">
                <CheckCircle2 size={48} strokeWidth={3} />
            </div>
            <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={24} />
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Paiement Réussi !</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Merci ! Votre vêtement H-designer est en préparation dans notre atelier.
          </p>
        </div>

        {/* Bloc Détails */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm space-y-3 text-left">
            {orderId && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500">N° Commande</span>
                    <span className="font-bold text-slate-900">#HD-{String(orderId).padStart(5, '0')}</span>
                </div>
            )}
            
            {transactionId && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Transaction</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">{transactionId}</span>
                </div>
            )}
            
            <p className="text-center text-slate-400 text-xs pt-1">
                La facture vous a été envoyée par email.
            </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3 pt-2">
            
            {/* Le bouton WhatsApp reste de la couleur officielle WhatsApp */}
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold hover:bg-[#20bd5a] shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={22} fill="currentColor" />
              Contacter l'atelier sur WhatsApp
            </a>

            <Link 
              to="/dashboard" 
              className="block w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Package size={20}/>
              Suivre ma commande
            </Link>

            <Link 
              to="/" 
              className="block w-full text-slate-500 py-3 font-semibold transition-colors flex items-center justify-center gap-2 text-sm mt-2 hover-theme-text"
            >
              <Home size={16}/>
              Retour à la boutique
            </Link>
        </div>

      </div>

      {/* 🪄 STYLE MAGIQUE POUR LES HOVERS */}
      <style>{`
        .hover-theme-text:hover {
            color: var(--theme-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default OrderConfirmed;