// 🛡️ SÉCURITÉ & PORTABILITÉ : Utilisation d'URL relatives pour passer par le proxy Vite en dev
// et fonctionner sur n'importe quel domaine en production.
const BASE_URL = import.meta.env.VITE_API_URL || "";
export const BASE_IMG_URL = BASE_URL.endsWith('/api') 
    ? `${BASE_URL.replace(/\/api$/, '')}/images/` 
    : `${BASE_URL}/images/`.replace(/^\/\//, '/'); // Gère le cas où BASE_URL est vide
