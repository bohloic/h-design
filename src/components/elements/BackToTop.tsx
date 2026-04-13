import { useState, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Gérer la visibilité et la progression au scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Visibilité (après 400px)
      setIsVisible(scrolled > 400);

      // Calcul du pourcentage de progression (pour le cercle de chargement)
      if (totalHeight > 0) {
        setScrollProgress((scrolled / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    setIsScrolling(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // Arrêter l'animation après le scroll (environ 800ms)
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  // Paramètres du cercle SVG
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scrollProgress / 100) * circumference;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-28 md:right-6 z-[1001] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={scrollToTop}
        className="back-to-top-btn relative group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white text-slate-800 rounded-full shadow-2xl border border-slate-100/50 backdrop-blur-md opacity-60 hover:opacity-100 transition-all duration-300"
        style={{
             backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Cercle de progression (le "loading" qui suit le scroll) */}
        <svg className="absolute w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="3"
          />
          <circle
            className="progress-ring__circle"
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke="var(--theme-primary, #ef4444)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        {/* Cœur du bouton (icône flèche ou loader) */}
        <div className="relative z-10">
          {isScrolling ? (
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
          ) : (
            <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
          )}
        </div>
        
        {/* Tooltip simple */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          REMONTER
        </span>
      </button>
    </div>
  );
};
