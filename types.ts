
export type Category = 'Hommes' | 'Femmes' | 'Enfants' | 'Accessoires' | 'Noël';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  isNew?: boolean;
  isFeatured?: boolean;
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
