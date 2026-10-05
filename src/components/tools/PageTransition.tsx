import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition
 * ─────────────────────────────────────────────
 * Wraps any page content with a smooth fade+slide-up animation.
 * Triggered on every route change.
 * Usage: wrap page content in <PageTransition> in AppShell
 */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => setIsVisible(true), 30);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
