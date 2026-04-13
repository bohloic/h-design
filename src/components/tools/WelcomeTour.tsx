import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Palette, X, ArrowRight, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomeTour: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenWelcomeTour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTour = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenWelcomeTour', 'true');
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      closeTour();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-carbon w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative border border-white/10">
        
        {/* Bouton Fermer Rapide */}
        <button 
          onClick={closeTour}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* CONTENU DES ÉTAPES */}
        <div className="p-8">
          
          {/* Étape 1 : Bienvenue */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-theme-primary/10 rounded-2xl flex items-center justify-center text-theme-primary mx-auto" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}>
                <Sparkles size={32} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-pure uppercase tracking-tight">Bienvenue chez H-Designer</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Découvrez l'élégance du sur-mesure à Abidjan. Laissez-nous vous guider à travers nos services exclusifs.
                </p>
              </div>
            </div>
          )}

          {/* Étape 2 : Chatbot IA */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
                <MessageCircle size={32} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-pure uppercase tracking-tight">Votre Assistant IA</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Besoin d'un conseil style ou d'une idée cadeau ? Notre Chatbot intelligent est là pour vous aider 24h/24 !
                </p>
              </div>
            </div>
          )}

          {/* Étape 3 : Personnalisation */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 mx-auto">
                <Palette size={32} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-pure uppercase tracking-tight">Créez votre Style</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Utilisez notre atelier pour personnaliser vos t-shirts avec vos textes, images ou même des designs générés par IA.
                </p>
              </div>
            </div>
          )}

          {/* FOOTER TOUR */}
          <div className="mt-10 flex flex-col gap-3">
             <button 
                onClick={nextStep}
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="w-full py-4 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
             >
                {step === 3 ? "C'est parti !" : "Continuer"} <ArrowRight size={18} />
             </button>
             
             {/* Indicateurs de progression */}
             <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-theme-primary' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
                    style={step === i ? { backgroundColor: 'var(--theme-primary)' } : {}}
                  />
                ))}
             </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WelcomeTour;
