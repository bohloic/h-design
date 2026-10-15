import { useState, useEffect, useCallback, useRef } from 'react';

export function useFormDraft<T extends Record<string, any>>(
  storageKey: string,
  initialData: T,
  options: { enabled?: boolean; debounceMs?: number } = {}
) {
  const { enabled = true, debounceMs = 500 } = options;
  const [formData, setFormData] = useState<T>(initialData);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const isInitialMount = useRef(true);

  // Vérifie si un brouillon existait au chargement
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = localStorage.getItem(`draft_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // On fusionne avec initialData pour garantir la présence de toutes les clés
          setFormData((prev) => ({ ...prev, ...parsed }));
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn(`[useFormDraft] Erreur lecture brouillon ${storageKey}:`, e);
    }
  }, [storageKey, enabled]);

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    if (!enabled) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`draft_${storageKey}`, JSON.stringify(formData));
      } catch (e) {
        console.warn(`[useFormDraft] Erreur sauvegarde brouillon ${storageKey}:`, e);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [formData, storageKey, enabled, debounceMs]);

  // Effacer le brouillon (à appeler après soumission réussie)
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`draft_${storageKey}`);
      setHasRestoredDraft(false);
    } catch (e) {
      console.warn(`[useFormDraft] Erreur suppression brouillon ${storageKey}:`, e);
    }
  }, [storageKey]);

  // Réinitialiser les données et effacer le brouillon
  const resetForm = useCallback((newData?: T) => {
    clearDraft();
    setFormData(newData || initialData);
  }, [clearDraft, initialData]);

  return {
    formData,
    setFormData,
    hasRestoredDraft,
    setHasRestoredDraft,
    clearDraft,
    resetForm
  };
}

export default useFormDraft;
