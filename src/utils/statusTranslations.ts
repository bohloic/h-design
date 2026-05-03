export const OrderStatus = {
  WAITING_VALIDATION: 'Validation Design', 
  PAID_WAITING_VALIDATION: 'Payé - Validation Design', 
  PENDING: 'En attente de paiement',
  PAID: 'Payé',
  PROCESSING: 'En préparation', 
  SHIPPED: 'Expédié',
  DELIVERED: 'Livré',
  RETURNED: 'Retourné',
  CANCELLED: 'Annulé',
  ACTION_REQUIRED: 'Action Requise',
  PAID_ACTION_REQUIRED: 'Payé - Action Requise'
};

export const translateStatus = (status: string): string => {
  if (!status) return 'Inconnu';
  const s = status.toLowerCase();
  
  // Mappings directs pour rétrocompatibilité (si la DB a encore de l'anglais)
  if (s === 'pending' || s.includes('attente de paiement')) return 'En attente de paiement ⏳';
  if (s === 'paid') return 'Payé ✅';
  if (s === 'processing') return 'En préparation 🛠️';
  if (s === 'shipped') return 'Expédié 🚚';
  if (s === 'delivered') return 'Livré ✨';
  if (s === 'cancelled') return 'Annulé ❌';
  if (s === 'returned') return 'Retourné 📦';
  if (s === 'waiting_validation') return 'Validation Design 🎨';
  if (s === 'action_required') return 'Action Requise ⚠️';

  // Si c'est déjà en français (avec ou sans icône)
  if (s.includes('en attente de paiement')) return 'En attente de paiement ⏳';
  if (s.includes('payé - à valider') || s.includes('payé - validation design')) return 'Payé - À Valider 🎨';
  if (s.includes('à valider') || s === 'validation design') return 'À Valider 🎨';
  if (s === 'payé') return 'Payé ✅';
  if (s.includes('en préparation')) return 'En préparation 🛠️';
  if (s.includes('expédié')) return 'Expédié 🚚';
  if (s.includes('livré')) return 'Livré ✨';
  if (s.includes('annulé')) return 'Annulé ❌';
  if (s.includes('retourné')) return 'Retourné 📦';
  if (s.includes('action requise')) return 'Action Requise ⚠️';

  // Pour le statut granulaire des articles (En attente, Validé, Refusé)
  if (s === 'en attente') return 'En attente ⏳';
  if (s === 'validé') return 'Validé ✅';
  if (s === 'refusé') return 'Refusé ❌';

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const getStatusColorClass = (status: string): string => {
  if (!status) return 'bg-slate-100 text-slate-500 border-slate-200';
  const s = status.toLowerCase();

  if (s.includes('validation design') || s.includes('à valider')) return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 animate-pulse ring-2 ring-fuchsia-400 ring-offset-1';
  if (s.includes('action requise')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (s.includes('en attente de paiement') || s === 'pending') return 'bg-amber-50 text-amber-600 border-amber-200 font-medium italic opacity-80';

  switch (s) {
    case 'paid':
    case 'payé': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'processing': 
    case 'en préparation': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'shipped': 
    case 'expédié': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'delivered': 
    case 'livré': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': 
    case 'annulé': return 'bg-red-100 text-red-700 border-red-200';
    case 'validé': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'refusé': return 'bg-red-100 text-red-700 border-red-200';
    case 'en attente': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};
