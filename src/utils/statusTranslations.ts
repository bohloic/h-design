export const OrderStatus = {
  WAITING_VALIDATION: 'waiting_validation', 
  PAID_WAITING_VALIDATION: 'paid_waiting_validation', 
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing', 
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
  ACTION_REQUIRED: 'action_required'
};

export const translateStatus = (status: string): string => {
  if (!status) return 'Inconnu';
  
  switch (status.toLowerCase()) {
    case 'pending': 
      return 'En attente';
    case 'paid': 
      return 'Payé';
    case 'processing': 
      return 'En préparation';
    case 'shipped': 
      return 'Expédié';
    case 'delivered': 
      return 'Livré';
    case 'returned': 
      return 'Retourné';
    case 'cancelled': 
      return 'Annulé';
    case 'waiting_validation': 
      return 'Design (Non Payé)';
    case 'paid_waiting_validation': 
      return 'À Valider 🎨';
    case 'action_required': 
      return 'Ajustement requis';
    default: 
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const getStatusColorClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'paid_waiting_validation': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 animate-pulse ring-2 ring-fuchsia-400 ring-offset-1';
    case 'waiting_validation': return 'bg-slate-100 text-slate-600 border-slate-200';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};
