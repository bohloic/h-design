// src/components/CarouselX.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ProductCard from '../../src/components/product/ProductCard';

// Import des styles Swiper obligatoires
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../../src/styles/Carousel.css';
import ProductCardX from '@/src/components/product/ProductCardX';

const CarouselX = ({ data }) => {
  // console.log(data)
  const filteredProducts = data
  // 1. Filtrer les produits selon la collection demandée
  // const filteredProducts = data?.filter(
  //   (item) => item.collection_id === targetCollection
  // );

  // console.log(filteredProducts)
  if (filteredProducts.length === 0) {
    return <p>Aucun produit trouvé dans la collection.</p>;
  }

  return (
    <section className="carousel-section">
      <h2 className="carousel-title">Nouvelle Collection </h2>
      
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20} // Espace entre les cartes
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          // Mobile (portrait) : 1.5 item visible pour inciter au scroll
          320: {
            slidesPerView: 1.5,
            spaceBetween: 10,
          },
          // Mobile (paysage) / Tablette
          640: {
            slidesPerView: 2.5,
            spaceBetween: 15,
          },
          // Tablette / Petit Laptop
          768: {
            slidesPerView: 3.5,
            spaceBetween: 20,
          },
          // Desktop (ta demande) : 5 items visibles
          1024: {
            slidesPerView: 5,
            spaceBetween: 25,
          },
        }}
        className="mySwiper"
      >
        {/* {console.log(filteredProducts)} */}
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