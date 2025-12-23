import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import nécessaire
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  // onCheckout n'est plus strictement nécessaire pour la navigation, 
  // mais on le garde pour la compatibilité si tu veux faire d'autres actions
  onCheckout?: () => void; 
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }) => {
  const navigate = useNavigate(); // 2. Initialisation du hook
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  // 3. Nouvelle fonction pour gérer le clic
  const handleCheckoutClick = () => {
    onClose(); // On ferme le tiroir
    navigate('/checkout'); // On navigue proprement sans le '#'
    if (onCheckout) onCheckout(); // On appelle l'ancienne prop au cas où
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            Mon Panier de Noël <span className="ml-2">🎁</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingCart size={64} className="opacity-20" />
              <p className="text-lg">Votre panier est vide comme une nuit sans neige.</p>
              <button 
                onClick={onClose}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors"
              >
                Commencer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex space-x-4 animate-fade-in">
                <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{formatCurrency(item.price)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 border rounded-full px-2 py-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-slate-50 border-t space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-red-600">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-slate-500 text-center italic">
              Livraison gratuite à partir de 50 000 FCFA d'achats festifs !
            </p>
            {/* 4. On utilise la nouvelle fonction ici */}
            <button 
              onClick={handleCheckoutClick} 
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-transform active:scale-[0.98]"
            >
              <span>Finaliser ma commande</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;