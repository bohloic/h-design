import React, { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, Wallet, Trash2, PlusCircle } from 'lucide-react';
import { usePaymentStore, PaymentMethodType } from '@/src/store/usePaymentStore';

export const Payments: React.FC = () => {
  const { preferredMethod, setPreferredMethod, savedCard, saveCard, removeCard } = usePaymentStore();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cardHolder: '',
    cvc: ''
  });

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, '').substring(0, 16);
    const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
    setFormData({...formData, cardNumber: formatted});
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d]/g, '').substring(0, 4);
    if (v.length > 2) {
      v = v.substring(0, 2) + '/' + v.substring(2);
    }
    setFormData({...formData, expiryDate: v});
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.cardNumber.length < 19) {
      alert("Numéro de carte invalide (16 chiffres requis)");
      return;
    }
    if (formData.cvc.length < 3) {
      alert("Code de sécurité (CVC) invalide");
      return;
    }
    
    // Validation de la date (MM/AA)
    const [monthStr, yearStr] = formData.expiryDate.split('/');
    if (!monthStr || !yearStr || monthStr.length < 2 || yearStr.length < 2) {
      alert("Date d'expiration invalide (format MM/AA)");
      return;
    }
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (month < 1 || month > 12) {
      alert("Mois d'expiration invalide (1-12)");
      return;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Les deux derniers chiffres
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      alert("La carte est expirée");
      return;
    }

    if (formData.cardNumber && formData.expiryDate && formData.cardHolder) {
      saveCard({
        // On ne sauvegarde que les 4 derniers chiffres pour la sécurité visuelle
        cardNumber: formData.cardNumber.slice(-4).padStart(formData.cardNumber.length, '•'),
        expiryDate: formData.expiryDate,
        cardHolder: formData.cardHolder.toUpperCase()
      });
      setIsAddingCard(false);
      setFormData({ cardNumber: '', expiryDate: '', cardHolder: '', cvc: '' });
    }
  };

  const handleMethodSelect = (method: PaymentMethodType) => {
    setPreferredMethod(method);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-white/5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-pure tracking-tight transition-colors">Moyens de paiement</h2>
            <p className="text-slate-500 mt-1">Gérez vos préférences pour un passage en caisse plus rapide.</p>
          </div>
          {!isAddingCard && !savedCard && (
            <button 
              onClick={() => setIsAddingCard(true)}
              className="flex items-center gap-2 text-sm font-bold text-white bg-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-md"
            >
              <PlusCircle size={18} />
              Ajouter une carte
            </button>
          )}
        </div>

        {/* CARTES SAUVEGARDÉES (VISUEL) */}
        {savedCard ? (
          <div className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden shadow-xl max-w-sm">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <CreditCard size={32} className="opacity-80" />
              <button 
                onClick={removeCard}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="Supprimer cette carte"
              >
                <Trash2 size={16} className="text-rose-300" />
              </button>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="text-xl tracking-widest font-mono opacity-90">{savedCard.cardNumber}</div>
              <div className="flex justify-between text-sm uppercase font-bold text-slate-300">
                <span>{savedCard.cardHolder}</span>
                <span>{savedCard.expiryDate}</span>
              </div>
            </div>
          </div>
        ) : isAddingCard ? (
          <form onSubmit={handleSaveCard} className="mb-10 bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-white/5 max-w-md animate-fade-in shadow-inner transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-pure mb-4 flex items-center gap-2 transition-colors"><CreditCard size={18} /> Nouvelle Carte</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nom sur la carte</label>
                <input type="text" required placeholder="Ex: JEAN DUPONT" value={formData.cardHolder} onChange={(e) => setFormData({...formData, cardHolder: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-black/20 dark:text-pure focus:border-slate-900 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none transition-all uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Numéro de carte</label>
                <input type="text" inputMode="numeric" required placeholder="0000 0000 0000 0000" maxLength={19} value={formData.cardNumber} onChange={handleCardNumberChange} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-black/20 dark:text-pure focus:border-slate-900 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none transition-all font-mono tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date d'exp.</label>
                  <input type="text" inputMode="numeric" required placeholder="MM/AA" maxLength={5} value={formData.expiryDate} onChange={handleExpiryChange} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-black/20 dark:text-pure focus:border-slate-900 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CVC</label>
                  <input type="text" inputMode="numeric" required placeholder="123" maxLength={4} value={formData.cvc} onChange={(e) => setFormData({...formData, cvc: e.target.value.replace(/[^\d]/g, '')})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-black/20 dark:text-pure focus:border-slate-900 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none transition-all font-mono" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingCard(false)} className="flex-1 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800 transition-colors">Ajouter</button>
              </div>
            </div>
            <p className="border-t border-slate-200 mt-4 pt-4 text-xs text-slate-400 flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> Les données de carte sont fictives et utilisées uniquement pour votre préférence de paiement.</p>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8 mb-4 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/20 max-w-md transition-colors">
            <div className="w-16 h-16 bg-white dark:bg-[#1A1A1C] text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center shadow-sm mb-4 transition-colors">
              <CreditCard size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-pure transition-colors mb-1">Aucune carte enregistrée</h3>
            <p className="text-slate-500 text-sm max-w-[250px]">Ajoutez une carte pour définir automatiquement le paiement en ligne par défaut.</p>
          </div>
        )}

        {/* PRÉFÉRENCES DE PAIEMENT */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/5 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-pure transition-colors mb-4 text-lg">Préférence par défaut</h3>
          <p className="text-sm text-slate-500 mb-6">Ce choix sera pré-sélectionné lors de la validation de vos commandes.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Option En ligne */}
            <button 
                onClick={() => handleMethodSelect('Mobile Money')}
                style={preferredMethod === 'Mobile Money' ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' } : {}}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-3 hover:shadow-md ${
                    preferredMethod === 'Mobile Money' ? 'shadow-sm' : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                }`}
            >
                <div className="flex justify-between items-center w-full">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <CreditCard size={20} />
                    </div>
                    {preferredMethod === 'Mobile Money' && <CheckCircle2 size={24} style={{ color: 'var(--theme-primary)' }} />}
                </div>
                <div className="text-left">
                    <h4 className="font-bold text-slate-900 dark:text-pure transition-colors">Paiement en ligne</h4>
                    <p className="text-xs text-slate-500 mt-1">Mobile Money (Orange, MTN, Wave), ou Carte CB géré sécuritairement par Paystack.</p>
                </div>
            </button>

            {/* Option Espèces */}
            <button 
                onClick={() => handleMethodSelect('Espèces')}
                style={preferredMethod === 'Espèces' ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' } : {}}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-3 hover:shadow-md ${
                    preferredMethod === 'Espèces' ? 'shadow-sm' : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                }`}
            >
                <div className="flex justify-between items-center w-full">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Wallet size={20} />
                    </div>
                    {preferredMethod === 'Espèces' && <CheckCircle2 size={24} style={{ color: 'var(--theme-primary)' }} />}
                </div>
                <div className="text-left">
                    <h4 className="font-bold text-slate-900 dark:text-pure transition-colors">Paiement à la livraison</h4>
                    <p className="text-xs text-slate-500 mt-1">Payez en espèces lorsque le livreur arrive avec votre colis.</p>
                </div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Payments;
