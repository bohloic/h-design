import React from 'react';
import { useTheme } from '../../utils/hooks/index.jsx';
import ErrorIllustration from '../../assets/404.svg';

function Error() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`m-8 flex flex-col items-center ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
      <h1 className={`text-3xl font-light ${isLight ? 'text-black' : 'text-white'}`}>
        Oups...
      </h1>
      
      <img src={ErrorIllustration} className="max-w-[800px] my-6" alt="Erreur 404" />
      
      {/* 🪄 LE TEXTE PREND LA COULEUR DU THÈME EN MODE CLAIR */}
      <h2 
        className="text-xl font-light"
        style={{ color: isLight ? 'var(--theme-primary)' : '#ffffff' }}
      >
        Il semblerait que la page que vous cherchez n’existe pas
      </h2>
    </div>
  );
}

export default Error;