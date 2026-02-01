export interface ProductVariant {
  id: number;
  colorName: string;
  hex: string;
  image?: string; // L'image spécifique à cette couleur
}

export interface Product {
  color: string;
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string; // Image par défaut
  category_name: string; // Vient de ta requête SQL
  collection_name?: string;
  variants: ProductVariant[]; // La liste des couleurs disponibles
}

export interface Category {
  id: number;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'En attente' | 'Payé' | 'Livré';
  paymentMethod: 'Carte' | 'Espèces' | 'Mobile Money';
}

export interface User {
  name: string;
  email: string;
  points: number;
  orders: Order[];
}

// Ajoute ceci après les imports
export interface DecodedToken {
  email: string;
  userId?: string; // Ajoute les autres champs si nécessaire (iat, exp, etc.)
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'sticker';
  content: string; // text string or image URL
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}
