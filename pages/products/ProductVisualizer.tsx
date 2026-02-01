import React, { useRef, useState } from 'react';

const ProductVisualizer = ({ tshirtImage, designImage, customText }) => {
  // On utilise un conteneur relatif pour empiler les couches
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
      
      {/* 1. L'image de fond (Le T-shirt vierge) */}
      <img 
        src={tshirtImage} 
        alt="T-shirt Base" 
        className="w-full h-full object-cover z-0 absolute"
      />

      {/* 2. La zone d'impression (limite où le design peut aller) */}
      <div className="absolute top-[25%] left-[30%] w-[40%] h-[50%] z-10 flex items-center justify-center border border-dashed border-transparent hover:border-slate-300">
        
        {/* Le Design (Logo/Image uploadée) */}
        {designImage && (
           <img 
             src={URL.createObjectURL(designImage)} 
             alt="Design Client" 
             className="max-w-full max-h-full object-contain mix-blend-multiply opacity-90"
             // mix-blend-multiply permet au design de "fondre" un peu dans le tissu
           />
        )}

        {/* Le Texte Personnalisé */}
        {customText && (
            <p className="absolute text-center font-bold text-xl break-words w-full" style={{ color: 'black' }}>
                {customText}
            </p>
        )}
      </div>

      {/* 3. Une couche d'ombres (Optionnel, pour le réalisme) */}
      {/* C'est une image PNG transparente avec juste les ombres et plis du T-shirt */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply opacity-50"
        style={{ backgroundImage: `url('/images/tshirt-shadows.png')`, backgroundSize: 'cover' }}
      ></div>

    </div>
  );
};

export default ProductVisualizer;