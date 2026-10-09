import React, { useState, useEffect } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Star, Sparkles, Truck, ShieldCheck, Send, Loader2,
  Palette, MousePointerClick, Shirt, ArrowRight
} from 'lucide-react';

// Components & Services
import { Product } from '../types';
import { getGiftAdvice } from '../services/geminiService';
import CollectionCarousel from '../pages/products/CollectionCarousel';
import TrendingSection from '@/components/product/TrendingProducts';
import SafeImage from '../src/components/tools/SafeImage';
import LoadingSpinner from '../src/components/tools/LoadingSpinner';
import { ProductGridSkeleton } from '../src/components/tools/ProductCardSkeleton';

// Images (Assurez-vous que ces imports fonctionnent, sinon remplacez par vos chemins)
import imageHome2 from '../src/assets/h_designer_hero_fashion_atelier_1774889548518.png';
import imageHome3 from '@/assets/image4.png';
import CatHome1 from '@/assets/cat1.png';
import CatHome2 from '@/assets/cat2.png';
import CatHome3 from '@/assets/cat3.png';
import CatHome4 from '@/assets/cat4.png';


interface HomeProps {
  onAddToCart: (product: Product) => void;
}

const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [productsCollection, setProductsCollection] = useState([]);

  // États IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const formatProducts = (data: any[]) => {
    if (!Array.isArray(data)) return [];
    return data.map((p: any) => {
      let cleanVariants = p.variants || [];
      if (typeof cleanVariants === 'string') {
        try { cleanVariants = JSON.parse(cleanVariants); } catch (e) { cleanVariants = []; }
      }
      let cleanSizes = p.sizes || [];
      if (typeof cleanSizes === 'string') {
        try { cleanSizes = JSON.parse(cleanSizes); } catch (e) { cleanSizes = []; }
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
        const collectionRes = await authFetch('/api/products/collection/3');
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
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 bg-[#F3F4F6] dark:bg-[#111827]">
        <div className="w-full h-72 sm:h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse skeleton-shimmer mb-8" />
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden bg-[#F3F4F6] dark:bg-[#111827] animate-in fade-in duration-700 font-sans text-[#111827] dark:text-[#F9FAFB] transition-colors">

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SafeImage
            src={imageHome2}
            alt="Hero Fashion"
            className="w-full h-full object-cover object-center animate-slow-zoom"
          />
          {/* 🖼️ Overlay semi-transparent direct sur l'image */}
          <div 
            className="absolute inset-0 hero-image-overlay" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} 
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <div className="max-w-3xl bg-black/40 backdrop-blur-md border border-white/20 p-6 md:p-12 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-1000">
            <span
              className="inline-block py-1.5 px-4 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 hero-text-shadow shadow-sm"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Nouvelle Collection
            </span>
            {/* 🪄 Typographie fluide clamp() pour grands titres */}
            <h1 className="fluid-hero-title font-black text-white mb-4 sm:mb-6 hero-text-shadow">
              IMPRIMEZ <br className="hidden sm:inline" /> VOTRE
              <span className="rainbow-text ml-2 sm:ml-4 hero-text-shadow">
                STYLE
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 mb-6 sm:mb-8 font-medium max-w-xl leading-relaxed hero-text-shadow">
              Créez des vêtements uniques ou découvrez des designs originaux créés par des artistes indépendants.
            </p>

            {/* 📱 Disposition verticale 100% sur mobile avec gap-4 (16px) */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={() => navigate('/personnaliser/mon-design')}
                className="w-full sm:w-auto group bg-white text-[#111827] px-8 py-4 rounded-full font-black text-base sm:text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Palette className="w-5 h-5 group-hover:rotate-12 transition-transform" style={{ color: 'var(--theme-primary)' }} />
                Je personnalise
              </button>
              {/* 🔘 Bouton Outline dynamique (Noir en Clair, Blanc en Sombre) */}
              <button
                onClick={() => navigate('/boutique')}
                className="w-full sm:w-auto btn-outline px-8 py-4 rounded-full font-bold text-base sm:text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2 group cursor-pointer hero-text-shadow"
              >
                Acheter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES RAPIDES ================= */}
      <section className="py-16 bg-[#F3F4F6] dark:bg-[#111827] transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#111827] dark:text-[#F9FAFB] uppercase tracking-tight">Que cherchez-vous ?</h2>
            <div
              className="w-20 h-1 mx-auto mt-4 rounded-full"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            ></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Homme", img: CatHome1 },
              { label: "Femme", img: CatHome2 },
              { label: "Enfant", img: CatHome3 },
              { label: "Unisexe", img: CatHome4 }
            ].map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/boutique', { state: { gender: cat.label } })}
                style={{ '--tw-border-opacity': 1, '--hover-border-color': 'var(--theme-primary)' } as React.CSSProperties}
                className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 border border-slate-200 dark:border-slate-800"
              >
                <SafeImage src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="text-white font-bold text-xl uppercase tracking-widest border-b-2 border-transparent group-hover:border-[color:var(--hover-border-color)] pb-1 transition-all hero-text-shadow">
                    {cat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRENDING SECTION ================= */}
      <div className="bg-[#FFFFFF] dark:bg-[#111827] pt-16 pb-8 transition-colors">
        <TrendingSection />
      </div>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section className="py-20 bg-slate-900 dark:bg-[#1F2937] text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-[100px]" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="font-bold uppercase tracking-widest text-sm text-blue-400">Simple & Rapide</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2 text-[#F9FAFB]">CRÉEZ VOTRE STYLE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { icon: <Shirt size={48} />, title: "1. Choisissez", desc: "Sélectionnez un produit parmi notre large gamme de haute qualité." },
              { icon: <MousePointerClick size={48} />, title: "2. Personnalisez", desc: "Ajoutez vos photos, textes ou motifs dans notre atelier intuitif." },
              { icon: <Truck size={48} />, title: "3. Recevez", desc: "Nous imprimons et expédions votre création en temps record." }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-6 group">
                <div
                  className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 transition-all duration-300 group-hover-theme shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-[#F9FAFB]">{step.title}</h3>
                  <p className="text-[#D1D5DB] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button
              onClick={() => navigate('/personnaliser/mon-design')}
              className="btn-outline px-10 py-4 rounded-full font-black text-lg shadow-xl cursor-pointer"
            >
              Commencer la création
            </button>
          </div>
        </div>
      </section>

      {/* ================= NOUVELLE COLLECTION ================= */}
      <section className="py-20 bg-[#F3F4F6] dark:bg-[#111827] transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 px-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-[#111827] dark:text-[#F9FAFB] uppercase">
                Nouvelle Collection
              </h2>
              <p className="text-[#4B5563] dark:text-[#D1D5DB] mt-2 text-lg">Les pièces incontournables du moment.</p>
            </div>
            <button
              onClick={() => navigate('/boutique')}
              className="hidden md:flex items-center gap-2 text-[#111827] dark:text-[#F9FAFB] font-bold border-b-2 pb-1 transition-colors hover-theme-text-border"
              style={{ borderColor: 'var(--theme-primary)' }}
            >
              Tout voir <ArrowRight size={18} />
            </button>
          </div>

          <CollectionCarousel data={productsCollection} targetCollection="" overrideTitle="" />

          <div className="mt-8 text-center md:hidden">
            <button
              onClick={() => navigate('/boutique')}
              className="btn-outline px-6 py-2.5 rounded-full font-bold text-sm"
            >
              Voir toute la boutique
            </button>
          </div>
        </div>
      </section>

      {/* ================= FEATURES (Réassurance) ================= */}
      <section className="py-16 bg-[#FFFFFF] dark:bg-[#1F2937] border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Truck className="w-8 h-8" />, title: "Livraison Rapide", txt: "Expédition en 24/48h" },
            { icon: <ShieldCheck className="w-8 h-8" />, title: "Paiement Sécurisé", txt: "Mobile Money & Cartes" },
            { icon: <Star className="w-8 h-8" />, title: "Qualité Garantie", txt: "Satisfait ou remboursé" }
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 bg-[#F3F4F6] dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', color: 'var(--theme-primary)' }}
              >
                {feat.icon}
              </div>
              <div>
                <h4 className="font-bold text-[#111827] dark:text-[#F9FAFB] text-lg">{feat.title}</h4>
                <p className="text-[#4B5563] dark:text-[#D1D5DB] text-sm">{feat.txt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= AI ASSISTANT BANNER ================= */}
      <section className="container mx-auto px-4 my-16">
        <div
          className="rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10"
          style={{ backgroundImage: 'linear-gradient(to right, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 60%, black))' }}
        >

          <Sparkles className="absolute top-10 left-10 text-white/20 w-32 h-32 animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 lg:w-1/2 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
              <Sparkles size={14} className="text-yellow-300" /> Assistant IA
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight hero-text-shadow">En panne d'inspiration ?</h2>
            <p className="text-white/95 text-lg mb-8 hero-text-shadow">Laissez notre intelligence artificielle vous trouver l'idée cadeau parfaite en quelques secondes.</p>

            <div className="bg-white dark:bg-[#111827] p-2 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-2 border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Cadeau romantique pour ma femme..."
                className="flex-1 bg-transparent border-none outline-none text-[#111827] dark:text-[#F9FAFB] px-4 py-3 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                onClick={handleAskAi}
                disabled={isLoadingAi}
                className="bg-[var(--theme-primary)] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                {isLoadingAi ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                <span className="hidden sm:inline">Générer</span>
              </button>
            </div>

            {aiResponse && (
              <div className="mt-8 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-4 text-white">
                  <div className="p-2 bg-yellow-400 rounded-full animate-pulse">
                    <Sparkles size={18} className="text-slate-900" />
                  </div>
                  <h4 className="font-bold tracking-tight">Conseils de votre Expert Style</h4>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed font-medium">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p {...props} className="mb-3 last:mb-0 text-[#F9FAFB]" />,
                      ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 mb-3 space-y-1" />,
                      li: ({ node, ...props }) => <li {...props} className="text-[#D1D5DB]" />,
                      strong: ({ node, ...props }) => <strong {...props} className="text-yellow-300 font-bold" />
                    }}
                  >
                    {aiResponse}
                  </ReactMarkdown>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex justify-center">
                  <button
                    onClick={() => navigate('/boutique')}
                    className="px-6 py-2.5 bg-yellow-400 text-slate-900 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-yellow-400/20"
                  >
                    Découvrir la Boutique <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block w-1/3 animate-in slide-in-from-right-10 duration-1000">
            <SafeImage
              src={imageHome3}
              alt="AI Helper"
              className={`object-contain drop-shadow-2xl hover:scale-105 transition-all duration-700 rounded-[2.5rem] shadow-xl border-4 border-white/20 
                ${aiResponse ? 'max-h-56' : 'max-h-80'}`}
            />
          </div>
        </div>
      </section>

      {/* 🪄 STYLE MAGIQUE POUR LES HOVERS COMPLEXES */}
      <style>{`
        .group:hover .group-hover-theme {
            background-color: var(--theme-primary) !important;
            border-color: var(--theme-primary) !important;
            transform: scale(1.1);
        }
        .hover-theme-bg:hover {
            background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent) !important;
            color: white !important;
        }
        .hover-theme-text-border:hover {
            color: var(--theme-primary) !important;
            border-color: color-mix(in srgb, var(--theme-primary) 50%, transparent) !important;
        }
      `}</style>

    </div>
  );
};

export default Home;