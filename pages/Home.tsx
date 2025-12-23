
import React, { useState } from 'react';
import { PRODUCTS, formatCurrency } from '../constants';
import { Product } from '../types';
// Fixed: Added Gift and ShoppingCart to the main lucide-react import
import { Star, Sparkles, Truck, ShieldCheck, Heart, Send, Gift, ShoppingCart } from 'lucide-react';
import { getGiftAdvice } from '../services/geminiService';

interface HomeProps {
  onAddToCart: (product: Product) => void;
}

const Home: React.FC<HomeProps> = ({ onAddToCart }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const featured = PRODUCTS.filter(p => p.isFeatured || p.isNew);

  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoadingAi(true);
    const advice = await getGiftAdvice(aiPrompt);
    setAiResponse(advice);
    setIsLoadingAi(false);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544273677-2423032729d7?auto=format&fit=crop&q=80&w=2000" 
            alt="Christmas Hero" 
            className="w-full h-full object-cover brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl animate-fade-in-up">
          <h1 className="christmas-font text-6xl md:text-8xl font-bold mb-6 drop-shadow-lg">
            Magie de Noël à Porter
          </h1>
          <p className="text-xl md:text-2xl mb-10 font-light max-w-2xl mx-auto opacity-90">
            Découvrez notre collection exclusive pour briller durant les fêtes. Élégance, confort et esprit festif réunis.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 shadow-xl">
              Explorer la Collection
            </button>
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/50 px-8 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105">
              Voir les Offres
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
          <div className="bg-red-100 p-4 rounded-full text-red-600">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Livraison Rapide</h3>
          <p className="text-slate-500">Recevez vos cadeaux à temps pour le réveillon partout au pays.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
          <div className="bg-green-100 p-4 rounded-full text-green-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Paiement Sécurisé</h3>
          <p className="text-slate-500">Cartes, Espèces ou Mobile Money. Payez comme vous voulez.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
          <div className="bg-amber-100 p-4 rounded-full text-amber-600">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Qualité Premium</h3>
          <p className="text-slate-500">Des tissus sélectionnés avec soin pour votre confort ultime.</p>
        </div>
      </section>

      {/* Featured Products */}
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
          {featured.map(product => (
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
                    onClick={() => onAddToCart(product)}
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

      {/* AI Assistant Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-red-600 rounded-[2rem] overflow-hidden relative p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Gift size={200} />
          </div>
          <div className="flex-1 space-y-6 z-10 text-white">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-bold backdrop-blur-sm">
              <Sparkles className="mr-2 w-4 h-4" /> IA de Noël
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">Besoin d'aide pour vos cadeaux ?</h2>
            <p className="text-lg opacity-80">Demandez à notre Lutin Assistant intelligent pour trouver le look parfait ou le cadeau idéal.</p>
            
            <div className="relative">
              <input 
                type="text" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Quel cadeau pour mon petit frère qui aime le rouge ?"
                className="w-full bg-white/10 border border-white/30 rounded-2xl py-5 px-6 pr-16 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button 
                onClick={handleAskAi}
                disabled={isLoadingAi}
                className="absolute right-3 top-3 bg-white text-red-600 p-3 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {isLoadingAi ? (
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {aiResponse && (
              <div className="mt-6 p-6 bg-white/90 backdrop-blur-md rounded-2xl text-slate-800 animate-fade-in-up">
                <p className="italic">{aiResponse}</p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 relative z-10 animate-bounce-slow">
             <img src="https://img.icons8.com/isometric/512/christmas-gift.png" alt="Lutin" className="w-full h-full object-contain" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
