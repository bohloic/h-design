/**
 * security.ts — Utilitaires de sécurité frontend
 * ─────────────────────────────────────────────
 * - Sanitize les inputs pour prévenir XSS
 * - Valide les champs de formulaire
 * - Sécurise les redirections (Open Redirect prevention)
 */

// ─── Sanitisation XSS ────────────────────────────────────────────────────────

/**
 * Échappe les caractères HTML dangereux pour prévenir les injections XSS.
 * À utiliser avant d'afficher une valeur issue de l'utilisateur dans le DOM.
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Supprime les balises HTML d'une chaîne (strip tags).
 * Utile pour nettoyer des champs texte avant envoi au serveur.
 */
export const stripHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Nettoie un objet de formulaire complet en appliquant stripHtml sur chaque valeur string.
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const result = {} as T;
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'string') {
      result[key] = stripHtml(value.trim()) as any;
    } else {
      result[key] = value;
    }
  }
  return result;
};

// ─── Validation ───────────────────────────────────────────────────────────────

/** Valide un email avec une regex robuste */
export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return re.test(email) && email.length <= 254;
};

/** Valide un numéro de téléphone (10 chiffres, format africain accepté) */
export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

/** Vérifie qu'une chaîne ne contient pas de séquences de script dangereuses */
export const containsMaliciousContent = (input: string): boolean => {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onload=, etc.
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];
  return patterns.some(p => p.test(input));
};

/** Valide la longueur d'un champ (min/max) */
export const isValidLength = (value: string, min: number, max: number): boolean => {
  const len = value.trim().length;
  return len >= min && len <= max;
};

// ─── Sécurité URL (Open Redirect Prevention) ─────────────────────────────────

/**
 * Vérifie qu'une URL de redirection est bien interne (même origine).
 * Prévient les attaques Open Redirect.
 */
export const isSafeRedirectUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    // URL relative : autorisée si elle commence par /
    return url.startsWith('/') && !url.startsWith('//');
  }
};

/**
 * Retourne l'URL de redirection si elle est sûre, sinon retourne le fallback.
 */
export const getSafeRedirectUrl = (url: string | null | undefined, fallback = '/'): string => {
  if (!url) return fallback;
  return isSafeRedirectUrl(url) ? url : fallback;
};

// ─── Rate limiting côté client (protection anti-spam) ────────────────────────

const actionTimestamps: Record<string, number[]> = {};

/**
 * Vérifie si une action peut être exécutée (rate limiting côté client).
 * @param actionKey - Identifiant unique de l'action (ex: 'login', 'checkout')
 * @param maxAttempts - Nombre max de tentatives autorisées
 * @param windowMs - Fenêtre de temps en millisecondes
 */
export const checkClientRateLimit = (
  actionKey: string,
  maxAttempts = 5,
  windowMs = 60000
): boolean => {
  const now = Date.now();
  if (!actionTimestamps[actionKey]) {
    actionTimestamps[actionKey] = [];
  }

  // Nettoie les tentatives expirées
  actionTimestamps[actionKey] = actionTimestamps[actionKey].filter(
    ts => now - ts < windowMs
  );

  if (actionTimestamps[actionKey].length >= maxAttempts) {
    return false; // Bloqué
  }

  actionTimestamps[actionKey].push(now);
  return true; // Autorisé
};

// ─── Nettoyage des params URL ─────────────────────────────────────────────────

/**
 * Lit un paramètre de l'URL de façon sécurisée et le sanitize.
 */
export const getSafeUrlParam = (params: URLSearchParams, key: string): string => {
  const val = params.get(key) || '';
  return stripHtml(val).slice(0, 500); // limite à 500 chars
};
