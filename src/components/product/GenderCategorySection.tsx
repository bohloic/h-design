import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/apiClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ProductCard from './ProductCard'; 

// Styles Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Liste des genres
const GENDERS = [
  { label: 'Homme', value: 'homme' },
  { label: 'Femme', value: 'femme' },
  { label: 'Enfant', value: 'enfant' },
  { label: 'Unisexe', value: 'unisexe' }
];

const GenderCategorySection = ({ categoryId, title }) => {
  const [activeGender, setActiveGender] = useState('homme');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await authFetch(`/api/products/filter?categoryId=${categoryId}&gender=${activeGender}`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            setProducts(data);
        } else {
            setProducts([]);
        }
      } catch (error) {
        console.error("Erreur de chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, activeGender]);

  return (
    <section className="py-8 lg:py-12 max-w-7xl mx-auto px-4">
      
      {/* --- En-tête Responsive : Titre + Onglets --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-3xl font-bold text-slate-900">{title}</h2>
        
        {/* Conteneur Onglets : Scrollable sur mobile si besoin */}
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex bg-slate-100 p-1 rounded-xl whitespace-nowrap min-w-min">
            {GENDERS.map((gender) => (
                <button
                key={gender.value}
                onClick={() => setActiveGender(gender.value)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeGender === gender.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                >
                {gender.label}
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* --- Contenu : Loading ou Carousel --- */}
      {loading ? (
        <div className="h-64 md:h-80 flex items-center justify-center bg-slate-50 rounded-2xl">
           <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-slate-900"></div>
        </div>
      ) : products.length > 0 ? (
        <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={12} // Espace réduit sur mobile
            slidesPerView={2.15} // ✅ Affiche 2 produits + un morceau du 3ème sur Mobile
            navigation
            breakpoints={{
                640: { slidesPerView: 2.5, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 24 }, // Desktop : 4 produits
            }}
            className="pb-10 !px-1" // Padding pour éviter de couper les ombres
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
               {/* Carte Produit */}
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium text-sm">Aucun produit trouvé pour <span className="text-slate-900 font-bold capitalize">{activeGender}</span> dans cette catégorie.</p>
        </div>
      )}
    </section>
  );
};

export default GenderCategorySection;