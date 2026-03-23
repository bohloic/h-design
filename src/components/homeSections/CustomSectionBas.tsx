import React from 'react';

interface CustomSectionProps {
  onCustomizeClick: () => void;
}

const CustomSectionBas: React.FC<CustomSectionProps> = ({ onCustomizeClick }) => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          
          {/* Left Side: Image avec effet premium */}
          <div className="w-full md:w-1/2 overflow-hidden rounded-3xl shadow-2xl group">
            <picture className="relative block aspect-square overflow-hidden bg-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" 
                alt="Personnalisation H-design"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
            </picture>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <span 
              className="text-sm font-bold tracking-[0.2em] uppercase mb-4"
              style={{ color: 'var(--theme-primary)' }}
            >
              Exclusivité Studio H-design
            </span>
            
            <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight uppercase tracking-tight">
              Personnalisation de <span style={{ color: 'var(--theme-primary)' }}>qualité</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Affirmez votre identité avec des pièces uniques. Notre atelier basé à Abidjan transforme vos inspirations en designs d'exception, sur des textiles sélectionnés pour leur tenue et leur confort.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onCustomizeClick}
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="inline-flex items-center justify-center px-10 py-4 text-base font-black rounded-xl text-white shadow-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 w-full sm:w-auto"
              >
                Je personnalise
              </button>
              
              <a 
                href="/boutique"
                className="inline-flex items-center justify-center px-10 py-4 border-2 border-gray-100 text-base font-black rounded-xl text-gray-900 bg-white transition-all duration-300 w-full sm:w-auto hover-theme-border"
              >
                Voir la collection
              </a>
            </div>

            {/* Preuve sociale / Users */}
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    className="inline-block h-10 w-10 rounded-full ring-4 ring-white object-cover" 
                    src={`https://picsum.photos/seed/${i + 20}/100/100`} 
                    alt="Client H-design" 
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 italic font-medium">
                Déjà plus de <span className="text-gray-900 font-bold">10,000 créations</span> uniques réalisées dans nos ateliers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🪄 STYLES DYNAMIQUES */}
      <style>{`
        .hover-theme-border:hover {
            border-color: var(--theme-primary) !important;
            color: var(--theme-primary) !important;
        }
      `}</style>
    </section>
  );
};

export default CustomSectionBas;