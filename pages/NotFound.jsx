import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Gift } from 'lucide-react'; 

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      
      {/* 🪄 404 GÉANT DYNAMIQUE (Couleur très claire du thème) */}
      <h1 
        className="text-[10rem] sm:text-[20rem] font-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none z-0 pointer-events-none"
        style={{ color: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' }}
      >
        404
      </h1>
      
      {/* Contenu principal (z-10 pour passer au dessus du 404 géant) */}
      <div className="relative z-10 max-w-lg mx-auto bg-white/50 backdrop-blur-sm p-6 rounded-3xl sm:bg-transparent">
        
        {/* 🪄 PASTILLE ICONE DYNAMIQUE */}
        <div 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce"
            style={{ 
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                color: 'var(--theme-primary)'
            }}
        >
            <Gift size={40} className="sm:w-12 sm:h-12" />
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            Oups ! Perdu ?
        </h2>
        
        <p className="text-slate-500 text-base md:text-lg mb-8 leading-relaxed">
          Il semblerait que ce design ne soit pas dans notre catalogue. La page que vous cherchez a disparu dans l'atelier.
        </p>

        {/* 🪄 BOUTON RETOUR DYNAMIQUE */}
        <Link 
          to="/" 
          style={{ backgroundColor: 'var(--theme-primary)' }}
          className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-bold shadow-lg opacity-95 hover:opacity-100 hover:scale-105 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Home size={20} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;