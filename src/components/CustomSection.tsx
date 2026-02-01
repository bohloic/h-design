import { useNavigate } from 'react-router-dom';
import React from 'react';

interface CustomSectionProps {
  onCustomizeClick: () => void;
}

const CustomSection: React.FC<CustomSectionProps> = ({ onCustomizeClick }) => {
    const navigate = useNavigate()
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          
          {/* Left Side: Image */}
          <div className="w-full md:w-1/2 overflow-hidden rounded-lg shadow-xl group">
            <picture className="relative block aspect-square overflow-hidden bg-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" 
                alt="Sweat de haute qualité avec broderie personnalisée"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
            </picture>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <span className="text-sm font-semibold tracking-widest text-red-600 uppercase mb-4">
              Exclusivité Studio
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight uppercase">
              Personnalisation de <span className="text-red-600">qualité</span>
            </h2>
            {/* <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Pour un look encore plus original : personnalisez votre style préféré. Que ce soit pour un cadeau unique ou pour affirmer votre identité, notre atelier transforme vos idées en pièces d'exception.
            </p> */}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/personnaliser/mon-design')}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 transform hover:-translate-y-1 active:scale-95 shadow-lg w-full sm:w-auto"
              >
                Je personnalise
              </button>
              <a 
                onClick={() => navigate('/boutique')}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-base font-bold rounded-md text-gray-900 bg-white hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto"
              >
                Voir la collection
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomSection;
