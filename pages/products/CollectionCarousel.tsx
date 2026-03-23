import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules'; // On garde juste Navigation
import ProductCard from '../../src/components/product/ProductCard';

// Import des styles Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import '../../src/styles/Carousel.css';

const CollectionCarousel = ({ data , targetCollection , overrideTitle }) => {
  
  const filteredProducts = targetCollection 
    ? data.filter((item: any) => item.collection?.toLowerCase() === targetCollection.toLowerCase())
    : data;

  if (filteredProducts.length === 0) {
    return <p className="text-center py-4 text-gray-500">Aucun produit trouvé dans la collection.</p>;
  }

  return (
    <section className="carousel-section my-4"> 
      
      {/* 🪄 TITRE DYNAMIQUE */}
      {overrideTitle && (
        <h2 className="text-2xl font-bold mb-4 px-2" style={{ color: 'var(--theme-primary)' }}>
            {overrideTitle}
        </h2>
      )}

      <Swiper
        modules={[Navigation]} 
        navigation
        // 🪄 NAVIGATION DYNAMIQUE + FIX TYPESCRIPT
        style={{
          '--swiper-navigation-color': 'var(--theme-primary)',
        } as React.CSSProperties}
        
        className="mySwiper" 
        
        breakpoints={{
          320: { slidesPerView: 2, spaceBetween: 10 },
          520: { slidesPerView: 3, spaceBetween: 15 },
          768: { slidesPerView: 4, spaceBetween: 20 },
          1024: { slidesPerView: 5, spaceBetween: 25 },
        }}
      >
        {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
          filteredProducts.map((product: any) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} onAddToCart={() => {}} /> 
            </SwiperSlide>
          ))
        ) : (
          <div className="text-center p-4 text-slate-400">
              Aucun produit disponible.
          </div>
        )}

      </Swiper>
    </section>
  );
};

export default CollectionCarousel;