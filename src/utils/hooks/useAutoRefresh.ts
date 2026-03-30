import { useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour rafraîchir silencieusement les données
 * @param callback La fonction de fetch à appeler
 * @param intervalMs Le délai entre deux appels (en ms). Par défaut: 10000ms (10sec)
 */
export const useAutoRefresh = (callback: () => void | Promise<void>, intervalMs: number = 10000) => {
  const savedCallback = useRef(callback);

  // Mémoriser la dernière version de callback pour éviter les re-renders infinis !
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Si l'intervalle est désactivé (0)
    if (intervalMs <= 0) return;

    const tick = () => {
      savedCallback.current();
    };

    // Mettre en place l'intervalle
    const id = setInterval(tick, intervalMs);

    // Nettoyage au démontage
    return () => clearInterval(id);
  }, [intervalMs]);
};
