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
  ACTION_REQUIRED: 'Action Requise'
};

export const translateStatus = (status: string): string => {
  if (!status) return 'Inconnu';
  const s = status.toLowerCase();
  
  // Nouveaux statuts français (directs ou via inclusion)
  if (s.includes('à valider') || s.includes('validation design')) return 'À Valider 🎨';
  if (s.includes('action requise')) return 'Ajustement requis ⚠️';
  if (s.includes('attente de paiement') || s === 'pending') return 'En attente ⏳';
  
  // Mappings directs (Rétrocompatibilité + Standardisation)
  switch (s) {
    case 'paid': 
    case 'payé': return 'Payé ✅';
    case 'processing': 
    case 'en préparation': return 'En préparation 🛠️';
    case 'shipped': 
    case 'expédié': return 'Expédié 🚚';
    case 'delivered': 
    case 'livré': return 'Livré ✨';
    case 'cancelled': 
    case 'annulé': return 'Annulé ❌';
    case 'returned':
    case 'retourné': return 'Retourné 📦';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const getStatusColorClass = (status: string): string => {
  if (!status) return 'bg-slate-100 text-slate-500 border-slate-200';
  const s = status.toLowerCase();

  if (s.includes('validation design')) return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 animate-pulse ring-2 ring-fuchsia-400 ring-offset-1';
  if (s.includes('action requise')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (s.includes('en attente de paiement')) return 'bg-slate-100 text-slate-600 border-slate-200';

  switch (s) {
    case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'processing': 
    case 'en préparation': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'shipped': 
    case 'expédié': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'delivered': 
    case 'livré': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': 
    case 'annulé': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};
