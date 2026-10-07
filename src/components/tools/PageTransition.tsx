import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingLottie from '../../components/tools/LoadingLottie';

/**
 * PageTransition
 * ─────────────────────────────────────────────
 * Wraps any page content with a smooth fade+slide-up animation.
 * Triggered on every route change.
 * Usage: wrap page content in <PageTransition> in AppShell
 */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Démarre l'animation de chargement
    setIsTransitioning(true);
    setIsVisible(false);

    // Arrête le chargement après un court délai pour l'effet visuel
    const loadTimer = setTimeout(() => {
      setIsTransitioning(false);
      setIsVisible(true);
    }, 400); // 400ms de chargement simulé/réel

    return () => clearTimeout(loadTimer);
  }, [location.pathname]);

  return (
    <>
      {/* Barre de progression en haut de l'écran */}
      <div
        className="fixed top-0 left-0 h-1 bg-theme-primary z-50 transition-all duration-300 ease-out"
        style={{
          width: isTransitioning ? '70%' : '100%',
          opacity: isTransitioning ? 1 : 0
        }}
      />

      {/* Overlay de chargement global (optionnel mais demandé pour bien voir le refresh) */}
      {isTransitioning && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-offwhite/50 dark:bg-carbon/50 backdrop-blur-sm">
          <LoadingLottie size={120} />
        </div>
      )}

      {/* Contenu de la page avec animation d'entrée */}
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: '100%',
        }}
      >
        {children}
      </div>
    </>
  );
};

export default PageTransition;
