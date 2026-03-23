export const FONTS = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Impact', 'Comic Sans MS'];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA');
};