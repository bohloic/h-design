import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { useWishlistStore } from '@/src/store/useWishlistStore';
import ProductCard from '@/src/components/product/ProductCard';

export const Wishlist: React.FC = () => {
  const { onAddToCart } = useOutletContext<{ onAddToCart?: (p: any) => void }>();
  const { items, clearWishlist } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 lg:p-10 shadow-sm border border-slate-100 dark:border-white/5 min-h-[60vh] flex flex-col items-center justify-center text-center transition-colors">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Heart size={48} className="animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-pure transition-colors mb-2">Votre liste d'envies est vide</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Vous n'avez pas encore ajouté de produits à votre liste d'envies. Parcourez notre boutique et trouvez votre bonheur !
        </p>
        <Link
          to="/boutique"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          <ShoppingBag size={20} />
          Découvrir nos produits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 transition-colors">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-pure transition-colors tracking-tight">Liste d'Envies</h2>
          <p className="text-slate-500 mt-1">{items.length} article(s) sauvegardé(s)</p>
        </div>
        <button
          onClick={clearWishlist}
          className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-colors font-bold text-sm"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Tout vider</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart || (() => { })}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
