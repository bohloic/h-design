import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Gift } from 'lucide-react'; // Ajout d'icônes

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      
      {/* Décoration d'arrière-plan (Le 404 géant) */}
      {/* text-[12rem] pour mobile, text-[20rem] pour ordi */}
      <h1 className="text-[10rem] sm:text-[20rem] font-black text-red-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none z-0 pointer-events-none">
        404
      </h1>
      
      {/* Contenu principal (z-10 pour passer au dessus du 404 géant) */}
      <div className="relative z-10 max-w-lg mx-auto bg-white/50 backdrop-blur-sm p-6 rounded-3xl sm:bg-transparent">
        
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce">
            <Gift size={40} className="text-red-600 sm:w-12 sm:h-12" />
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            Oups ! Perdu ?
        </h2>
        
        <p className="text-slate-500 text-base md:text-lg mb-8 leading-relaxed">
          Il semblerait que le traîneau du Père Noël ne passe pas par ici. La page que vous cherchez a disparu dans la neige.
        </p>

        {/* Bouton de retour */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-105 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Home size={20} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;