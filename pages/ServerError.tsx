import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ServerCrash, RefreshCw } from 'lucide-react';

const ServerError: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-carbon flex flex-col items-center justify-center text-center px-4 relative overflow-hidden transition-colors">
      
      {/* 500 Géant en arrière-plan */}
      <h1 
        className="text-[10rem] sm:text-[20rem] font-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none z-0 pointer-events-none opacity-5 dark:opacity-10 text-slate-900 dark:text-pure"
      >
        500
      </h1>
      
      {/* Contenu principal */}
      <div className="relative z-10 max-w-lg mx-auto bg-white/80 dark:bg-[#1A1A1D]/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 space-y-6">
        
        <div 
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto shadow-sm"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--theme-primary, #dc2626) 15%, transparent)',
            color: 'var(--theme-primary, #dc2626)'
          }}
        >
          <ServerCrash size={40} className="sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-pure">
            Panne Serveur Momentanée
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Nos serveurs rencontrent une charge exceptionnelle ou effectuent une maintenance de sécurité. Notre équipe technique a été automatiquement alertée.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button 
            onClick={() => window.location.reload()}
            style={{ backgroundColor: 'var(--theme-primary, #dc2626)' }}
            className="inline-flex items-center gap-2 text-white px-6 py-3.5 rounded-full font-bold shadow-lg hover:opacity-95 transition-all active:scale-95 justify-center cursor-pointer"
          >
            <RefreshCw size={18} />
            <span>Réessayer</span>
          </button>

          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3.5 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 justify-center cursor-pointer"
          >
            <Home size={18} />
            <span>Accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
