
export enum OrderStatus {
  PENDING = 'En attente',
  SHIPPED = 'Expédié',
  DELIVERED = 'Livré',
  CANCELLED = 'Annulé'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  joinDate: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}
