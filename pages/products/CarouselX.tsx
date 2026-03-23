import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import des styles Swiper obligatoires
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../../src/styles/Carousel.css';
import ProductCardX from '@/src/components/product/ProductCardX';

const CarouselX = ({ data }) => {
  const filteredProducts = data;

  if (filteredProducts.length === 0) {
    return <p>Aucun produit trouvé dans la collection.</p>;
  }

  return (
    <section className="carousel-section">
      {/* 🪄 TITRE DYNAMIQUE */}
      <h2 className="carousel-title" style={{ color: 'var(--theme-primary)' }}>
        Nouvelle Collection
      </h2>
      
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        navigation
        pagination={{ clickable: true }}
        // 🪄 MAGIE SWIPER : On surcharge les variables CSS de Swiper avec notre couleur de thème
        style={{
          '--swiper-navigation-color': 'var(--theme-primary)',
          '--swiper-pagination-color': 'var(--theme-primary)',
        } as React.CSSProperties}
        breakpoints={{
          320: {
            slidesPerView: 1.5,
            spaceBetween: 10,
          },
          640: {
            slidesPerView: 2.5,
            spaceBetween: 15,
          },
          768: {
            slidesPerView: 3.5,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 25,
          },
        }}
        className="mySwiper"
      >
        {filteredProducts.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCardX product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default CarouselX;