import { formatCurrency } from "@/constants";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";
import {useState} from 'react'


export const productByCategory = () => {
    const [product, setProduct] = useState([])
    

    return (
        <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Nos Incontournables</h2>
            <p className="text-slate-500">Les pièces favorites de nos lutins stylistes.</p>
          </div>
          <button className="text-red-600 font-bold flex items-center hover:underline">
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
                  <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Nouveau
                  </span>
                )}
                <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-400 hover:text-red-600 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
                <h3 className="font-bold text-lg mb-2 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-black text-red-600">{formatCurrency(product.price)}</span>
                  <button 
                    // onClick={() => onAddToCart(product)}
                    className="bg-slate-900 text-white p-3 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
}