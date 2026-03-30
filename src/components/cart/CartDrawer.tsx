import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { CartItem } from '../../../types';
import { formatCurrency } from '../../../constants';
import { BASE_IMG_URL } from '../images/VoirImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout?: () => void; 
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }) => {
  const navigate = useNavigate(); 
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    const token = localStorage.getItem('token');
    onClose();
    if (!token) {
      // Redirige vers login en mémorisant l'intention de checkout
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
    if (onCheckout) onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-carbon h-full shadow-2xl flex flex-col animate-slide-in-right text-slate-900 dark:text-pure transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <h2 className="text-xl font-bold flex items-center">
            Mon Panier <span className="ml-2">🛍️</span>
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-pure hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-4 text-center">
              <ShoppingCart size={64} className="opacity-20" />
              <p className="text-lg">Votre panier est vide comme une nuit sans étoiles.</p>
              <button 
                onClick={onClose}
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="text-white px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                Commencer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex space-x-4 animate-fade-in">
                {/* 🪄 FIX 1 : On vérifie image_url ou image, et on s'assure que c'est une string */}
                <img 
                    src={BASE_IMG_URL + (item.image_url || (item as any).image)} 
                    alt={item.name} 
                    className="w-20 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-800" 
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-pure">{item.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{formatCurrency(item.price)}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 border border-slate-700 rounded-full px-2 py-1">
                      <button 
                        // 🪄 FIX 2 : Conversion de l'ID en String
                        onClick={() => onUpdateQuantity(String(item.id), -1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 theme-cart-btn"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      
                      <button 
                        // 🪄 FIX 3 : Conversion de l'ID en String
                        onClick={() => onUpdateQuantity(String(item.id), 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors theme-cart-btn"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      // 🪄 FIX 4 : Conversion de l'ID en String
                      onClick={() => onRemove(String(item.id))}
                      className="p-2 text-red-500 hover:bg-red-900/30 rounded-full transition-colors"
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
          <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span style={{ color: 'var(--theme-primary)' }}>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center italic">
              Livraison gratuite disponible selon votre zone !
            </p>
            
            <button 
              onClick={handleCheckoutClick} 
              style={{ backgroundColor: 'var(--theme-primary)' }}
              className="w-full text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:opacity-95 transition-all active:scale-[0.98]"
            >
              <span>Finaliser ma commande</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .theme-cart-btn:hover {
            color: var(--theme-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default CartDrawer;