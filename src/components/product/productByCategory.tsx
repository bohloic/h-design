import { formatCurrency } from "@/constants";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";
import {useState} from 'react'

export const productByCategory = () => {
    // 💡 Note : N'oublie pas de typer ton state et d'ajouter la logique de fetch plus tard !
    const [product, setProduct] = useState<any[]>([]) 

    return (
        <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Nos Incontournables</h2>
            <p className="text-slate-500">Les pièces favorites de nos stylistes.</p>
          </div>
          <button 
            className="font-bold flex items-center hover:underline transition-colors"
            style={{ color: 'var(--theme-primary)' }}
          >
            Voir tout <Sparkles className="ml-2 w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {product?.map(product => (
            <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-80 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {product.isNew && (
                  <span 
                    className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                    Nouveau
                  </span>
                )}
                <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-400 transition-colors hover-theme-text">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
                <h3 className="font-bold text-lg mb-2 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span 
                    className="text-xl font-black"
                    style={{ color: 'var(--theme-primary)' }}
                  >
                    {formatCurrency(product.price)}
                  </span>
                  <button 
                    // onClick={() => onAddToCart(product)}
                    className="bg-slate-900 text-white p-3 rounded-xl transition-colors shadow-md hover-theme-bg active:scale-95"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🪄 STYLES DYNAMIQUES */}
        <style>{`
          .hover-theme-text:hover {
              color: var(--theme-primary) !important;
          }
          .hover-theme-bg:hover {
              background-color: var(--theme-primary) !important;
          }
        `}</style>
      </section>
    );
}