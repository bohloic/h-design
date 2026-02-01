import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/apiClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import ProductCard from './ProductCard'; 
import 'swiper/css';
import 'swiper/css/navigation';

interface ProductCarouselProps {
  title: string;
  endpoint?: string;     // URL API (ex: pour la collection)
  staticProducts?: any[]; // Produits déjà chargés (ex: pour l'historique)
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, endpoint, staticProducts }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cas 1 : Produits statiques (Historique)
    if (staticProducts && staticProducts.length > 0) {
        setProducts(staticProducts);
        return;
    }

    // Cas 2 : Chargement depuis API (Collection)
    if (endpoint) {
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await authFetch(endpoint);
                const data = await res.json();
                if (Array.isArray(data)) setProducts(data);
            } catch (e) {
                console.error("Erreur carousel", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }
  }, [endpoint, staticProducts]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-6 border-t border-slate-100 mt-8">
      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6">{title}</h3>
      
      {loading ? (
         <div className="flex gap-4 overflow-hidden">
             {[1,2,3,4].map(i => <div key={i} className="w-40 h-60 bg-slate-50 rounded-xl animate-pulse flex-shrink-0" />)}
         </div>
      ) : (
        <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerView={2.15} // Affiche 2 produits et demi sur mobile
            navigation
            breakpoints={{
                640: { slidesPerView: 2.5, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
            }}
            className="pb-4"
        >
          {products.map((p) => (
            <SwiperSlide key={p.id}>
              <ProductCard product={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};

export default ProductCarousel;