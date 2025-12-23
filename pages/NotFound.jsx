import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
      {/* Code d'erreur géant */}
      <h1 className="text-9xl font-extrabold text-slate-200">404</h1>
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Oups ! Page introuvable.</h2>
        <p className="text-slate-500 mb-8">
          Désolé, la page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        {/* Bouton de retour */}
        <Link 
          to="/" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;