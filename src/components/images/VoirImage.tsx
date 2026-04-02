// Si votre Backend tourne sur production.com, les images s'y adaptent !
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:205";
export const BASE_IMG_URL = `${BASE_URL}/images/`;
