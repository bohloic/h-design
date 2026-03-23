import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // On récupère l'URL actuelle
  const { pathname } = useLocation();

  useEffect(() => {
    // À chaque fois que le "pathname" change, on scroll en haut (0, 0)
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Ce composant n'affiche rien visuellement
};

export default ScrollToTop;