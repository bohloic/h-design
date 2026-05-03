
export enum OrderStatus {
  PENDING = 'En attente de paiement',
  WAITING_VALIDATION = 'Validation Design',
  PAID_WAITING_VALIDATION = 'Payé - Validation Design',
  PROCESSING = 'En préparation',
  SHIPPED = 'Expédié',
  DELIVERED = 'Livré',
  CANCELLED = 'Annulé',
  RETURNED = 'Retourné',
  ACTION_REQUIRED = 'Action Requise',
  PAID_ACTION_REQUIRED = 'Payé - Action Requise'
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
