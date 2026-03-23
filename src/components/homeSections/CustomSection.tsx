import { useNavigate } from 'react-router-dom';
import React from 'react';

interface CustomSectionProps {
  onCustomizeClick: () => void;
}

const CustomSection: React.FC<CustomSectionProps> = ({ onCustomizeClick }) => {
    const navigate = useNavigate();

  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          
          {/* Left Side: Image Premium */}
          <div className="w-full md:w-1/2 overflow-hidden rounded-3xl shadow-2xl group order-2 md:order-1">
            <picture className="relative block aspect-square overflow-hidden bg-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" 
                alt="Atelier de personnalisation H-design"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
            </picture>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center order-1 md:order-2">
            <span 
              className="text-sm font-bold tracking-[0.2em] uppercase mb-4"
              style={{ color: 'var(--theme-primary)' }}
            >
              Exclusivité Atelier H-design
            </span>
            
            <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight uppercase tracking-tight">
              Personnalisation de <span style={{ color: 'var(--theme-primary)' }}>qualité</span>
            </h2>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Libérez votre créativité dans notre studio. De la broderie fine à l'impression haute définition, nous donnons vie à vos idées sur nos textiles premium sélectionnés à Abidjan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/personnaliser/mon-design')}
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="inline-flex items-center justify-center px-10 py-4 text-base font-black rounded-xl text-white shadow-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 w-full sm:w-auto"
              >
                Je personnalise
              </button>
              
              <button 
                onClick={() => navigate('/boutique')}
                className="inline-flex items-center justify-center px-10 py-4 border-2 border-gray-100 text-base font-black rounded-xl text-gray-900 bg-white transition-all duration-300 w-full sm:w-auto hover-theme-border"
              >
                Voir la collection
              </button>
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

export default CustomSection;