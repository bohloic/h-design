import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { CartItem } from '../../../types';
import { formatCurrency } from '../../../constants';
import SafeImage from '../tools/SafeImage';

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

  // Fermeture via la touche Échap
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 🔒 Verrouillage du scroll en arrière-plan lorsque le tiroir panier est ouvert
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
    if (onCheckout) onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col animate-slide-in-right text-slate-900 transition-colors overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between transition-colors bg-white shrink-0 z-10">
          <h2 className="text-lg sm:text-xl font-bold flex items-center text-slate-900">
            Mon Panier <span className="ml-2">🛍️</span>
            {items.length > 0 && (
              <span className="ml-2.5 px-2.5 py-0.5 text-xs font-black rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </h2>
          <button 
            onClick={onClose} 
            style={{ touchAction: 'manipulation' }}
            aria-label="Fermer le panier"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative z-50 touch-target-44 active:scale-95"
          >
            <X className="w-6 h-6 pointer-events-none" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 overscroll-contain">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 text-center">
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
              <div key={item.id} className="flex space-x-4 animate-fade-in bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <SafeImage 
                    src={item.image_url || (item as any).image || (item as any).options?.customizationImage} 
                    alt={item.name} 
                    className="w-20 h-24 object-cover rounded-lg border border-slate-200" 
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{formatCurrency(item.price)}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 border border-slate-200 rounded-full px-2 py-1 bg-slate-50">
                      <button 
                        onClick={() => onUpdateQuantity(String(item.id), -1)}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-30 theme-cart-btn"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-8 text-center font-medium text-slate-800">{item.quantity}</span>
                      
                      <button 
                        onClick={() => onUpdateQuantity(String(item.id), 1)}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors theme-cart-btn"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => onRemove(String(item.id))}
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
          <div className="p-4 sm:p-6 bg-white sm:bg-slate-50 border-t border-slate-200 space-y-3 shrink-0 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] z-20 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-colors">
            <div className="flex justify-between items-center text-base sm:text-lg font-bold">
              <span>Total</span>
              <span style={{ color: 'var(--theme-primary)' }} className="text-xl sm:text-2xl font-black">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-slate-500 text-center italic">
              Livraison gratuite disponible selon votre zone !
            </p>
            
            <button 
              onClick={handleCheckoutClick} 
              style={{ backgroundColor: 'var(--theme-primary)' }}
              className="w-full text-white py-3.5 sm:py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xl hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer text-sm sm:text-base"
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