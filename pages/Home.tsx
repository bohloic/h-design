import React, { useState, useEffect } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Sparkles, Truck, ShieldCheck, Send, Gift, Loader2, 
  Palette, MousePointerClick, Shirt, ArrowRight 
} from 'lucide-react';

// Components & Services
import { Product } from '../types';
import { getGiftAdvice } from '../services/geminiService';
import CollectionCarousel from '../pages/products/CollectionCarousel';
import TrendingSection from '@/src/components/product/TrendingProducts';

// Images (Assurez-vous que ces imports fonctionnent, sinon remplacez par vos chemins)
import imageHome from '@/src/assets/image1.png'; // Image pour la section perso
import imageHome2 from '@/src/assets/image2.jpg'; // Hero background
import imageHome3 from '@/src/assets/image3.jpg'; // AI image

interface HomeProps {
  onAddToCart: (product: Product) => void;
}

const Home: React.FC<HomeProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [productsCollection, setProductsCollection] = useState([]);
  
  // États IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Fonction de nettoyage (identique à celle qu'on a validée)
  const formatProducts = (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map((p: any) => {
          let cleanVariants = p.variants || [];
          if (typeof cleanVariants === 'string') {
              try { cleanVariants = JSON.parse(cleanVariants); } catch(e) { cleanVariants = []; }
          }
          let cleanSizes = p.sizes || [];
          if (typeof cleanSizes === 'string') {
              try { cleanSizes = JSON.parse(cleanSizes); } catch(e) { cleanSizes = []; }
          }
          const hasOptions = (cleanVariants.length > 0) || (cleanSizes.length > 0);
          return {
              ...p,
              price: parseFloat(p.price),
              variants: Array.isArray(cleanVariants) ? cleanVariants : [],
              sizes: Array.isArray(cleanSizes) ? cleanSizes : [],
              hasOptions: hasOptions
          };
      });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsPageLoading(true);
        const collectionRes = await authFetch('/api/products/collection/3'); // ID Collection "Vedette"
        const collectionData = await collectionRes.json();
        setProductsCollection(formatProducts(collectionData));
      } catch (error) {
        console.error("Erreur chargement Home:", error);
      } finally {
        setIsPageLoading(false);
      }
    };
    loadData();
  }, []);
  
  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoadingAi(true);
    try {
        const advice = await getGiftAdvice(aiPrompt);
        setAiResponse(advice);
    } catch (e) { console.error(e); } 
    finally { setIsLoadingAi(false); }
  };

  if (isPageLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
        <p className="text-slate-900 font-bold text-lg tracking-widest uppercase">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden bg-white animate-in fade-in duration-700 font-sans">
      
      {/* ================= HERO SECTION (Style Spreadshirt) ================= */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        {/* Background Image avec un overlay subtil */}
        <div className="absolute inset-0 z-0">
          <img 
            src={imageHome2} 
            alt="Hero Fashion" 
            className="w-full h-full object-cover object-center animate-slow-zoom" 
          />
          {/* Gradient noir léger pour lisibilité */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        {/* Content Box - Style "Card" flottante */}
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <div className="max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-12 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-1000">
            <span className="inline-block py-1 px-3 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-widest mb-6">
              Nouvelle Collection
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight mb-6 drop-shadow-lg">
              IMPRIMEZ <br/> VOTRE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400">STYLE</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 font-medium max-w-xl leading-relaxed">
              Créez des vêtements uniques ou découvrez des designs originaux créés par des artistes indépendants.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/personnaliser/mon-design')}
                className="group bg-white text-slate-900 px-8 py-4 rounded-full font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Palette className="w-5 h-5 text-red-600 group-hover:rotate-12 transition-transform" />
                Je personnalise
              </button>
              <button 
                onClick={() => navigate('/boutique')}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2 group"
              >
                Acheter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES RAPIDES (Nouveau) ================= */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Que cherchez-vous ?</h2>
            <div className="w-20 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Homme", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80" },
              { label: "Femme", img: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=500&q=80" },
              { label: "Enfant", img: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=500&q=80" },
              { label: "Unisexe", img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=80" }
            ].map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate('/boutique')} // Tu pourras filtrer par catégorie plus tard
                className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500"
              >
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="text-white font-bold text-xl uppercase tracking-widest border-b-2 border-transparent group-hover:border-red-500 pb-1 transition-all">
                    {cat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRENDING SECTION ================= */}
      {/* On enlève le bg-slate-50 car la section catégorie l'a déjà, on alterne Blanc/Gris */}
      <div className="bg-white pt-16 pb-8">
        <TrendingSection />
      </div>

      {/* ================= COMMENT ÇA MARCHE (Step by Step) ================= */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
        {/* Décoration d'arrière plan */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-red-600 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="text-red-500 font-bold uppercase tracking-widest text-sm">Simple & Rapide</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">CRÉEZ VOTRE STYLE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { icon: <Shirt size={48} />, title: "1. Choisissez", desc: "Sélectionnez un produit parmi notre large gamme de haute qualité." },
              { icon: <MousePointerClick size={48} />, title: "2. Personnalisez", desc: "Ajoutez vos photos, textes ou motifs dans notre atelier intuitif." },
              { icon: <Truck size={48} />, title: "3. Recevez", desc: "Nous imprimons et expédions votre création en temps record." }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-6 group">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-red-600 group-hover:border-red-600 group-hover:scale-110 transition-all duration-300 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button 
                onClick={() => navigate('/personnaliser/mon-design')}
                className="bg-white text-slate-900 px-10 py-4 rounded-full font-black text-lg shadow-xl hover:bg-red-50 transition-colors"
            >
                Commencer la création
            </button>
          </div>
        </div>
      </section>

      {/* ================= NOUVELLE COLLECTION ================= */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 px-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase">
                Nouvelle Collection
              </h2>
              <p className="text-slate-500 mt-2 text-lg">Les pièces incontournables du moment.</p>
            </div>
            <button 
                onClick={() => navigate('/boutique')}
                className="hidden md:flex items-center gap-2 text-slate-900 font-bold border-b-2 border-red-600 pb-1 hover:text-red-600 transition-colors"
            >
                Tout voir <ArrowRight size={18}/>
            </button>
          </div>
          
          <CollectionCarousel data={productsCollection} targetCollection="" overrideTitle="" />
          
          <div className="mt-8 text-center md:hidden">
            <button onClick={() => navigate('/boutique')} className="text-red-600 font-bold border-2 border-red-600 px-6 py-2 rounded-full">
                Voir toute la boutique
            </button>
          </div>
        </div>
      </section>

      {/* ================= FEATURES (Réassurance) ================= */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Truck className="w-8 h-8" />, title: "Livraison Rapide", txt: "Expédition en 24/48h" },
            { icon: <ShieldCheck className="w-8 h-8" />, title: "Paiement Sécurisé", txt: "Mobile Money & Cartes" },
            { icon: <Star className="w-8 h-8" />, title: "Qualité Garantie", txt: "Satisfait ou remboursé" }
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0">
                {feat.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{feat.title}</h4>
                <p className="text-slate-500 text-sm">{feat.txt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= AI ASSISTANT BANNER ================= */}
      <section className="container mx-auto px-4 my-16">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Déco */}
          <Sparkles className="absolute top-10 left-10 text-white/20 w-32 h-32 animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 lg:w-1/2 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
                <Sparkles size={14} className="text-yellow-300"/> Assistant IA
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">En panne d'inspiration ?</h2>
            <p className="text-white/90 text-lg mb-8">Laissez notre intelligence artificielle vous trouver l'idée cadeau parfaite en quelques secondes.</p>
            
            <div className="bg-white p-2 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Cadeau romantique pour ma femme..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-900 px-4 py-3 placeholder:text-slate-400"
                />
                <button 
                    onClick={handleAskAi}
                    disabled={isLoadingAi}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    {isLoadingAi ? <Loader2 className="animate-spin"/> : <Send size={18} />}
                    <span className="hidden sm:inline">Générer</span>
                </button>
            </div>

            {/* Réponse IA */}
            {aiResponse && (
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm font-medium leading-relaxed">💡 {aiResponse}</p>
                </div>
            )}
          </div>

          <div className="relative z-10 lg:w-5/12 flex justify-center">
             <img 
                src={imageHome3} 
                alt="AI Helper" 
                className="max-h-80 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
             />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;