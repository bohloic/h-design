import { Product, Order, OrderStatus, Customer, Category } from '../typesAdmin';


// Mock initial data
let products: Product[] = [
  { id: '1', name: 'T-shirt Oversize Noir', category: 'Hauts', price: 29.99, stock: 45, image: 'https://picsum.photos/seed/p1/400/500' },
  { id: '2', name: 'Jean Slim Bleu', category: 'Pantalons', price: 59.90, stock: 22, image: 'https://picsum.photos/seed/p2/400/500' },
  { id: '3', name: 'Pull en Cachemire Rose', category: 'Hauts', price: 89.00, stock: 12, image: 'https://picsum.photos/seed/p3/400/500' },
  { id: '4', name: 'Robe d\'été à fleurs', category: 'Robes', price: 45.00, stock: 18, image: 'https://picsum.photos/seed/p4/400/500' },
  { id: '5', name: 'Veste en Cuir Moto', category: 'Vestes', price: 129.99, stock: 5, image: 'https://picsum.photos/seed/p5/400/500' },
];

let orders: Order[] = [
  { 
    id: 'ORD-001', 
    customerName: 'Jean Dupont', 
    customerEmail: 'jean.dupont@email.com',
    date: '2023-10-24', 
    total: 89.89, 
    status: OrderStatus.SHIPPED,
    items: [
      { productId: '1', productName: 'T-shirt Oversize Noir', quantity: 1, price: 29.99, size: 'L' },
      { productId: '2', productName: 'Jean Slim Bleu', quantity: 1, price: 59.90, size: 'M' }
    ]
  },
  { 
    id: 'ORD-002', 
    customerName: 'Marie Curie', 
    customerEmail: 'marie.c@email.com',
    date: '2023-10-25', 
    total: 178.00, 
    status: OrderStatus.PENDING,
    items: [
      { productId: '3', productName: 'Pull en Cachemire Rose', quantity: 2, price: 89.00, size: 'S' }
    ]
  },
];



let customers: Customer[] = [
  { id: 'C1', name: 'Jean Dupont', email: 'jean.dupont@email.com', totalSpent: 89.89, orderCount: 1, joinDate: '2023-01-15' },
  { id: 'C2', name: 'Marie Curie', email: 'marie.c@email.com', totalSpent: 178.00, orderCount: 1, joinDate: '2023-02-20' },
];


// console.log(localStorage)

// CRUD Product
export const getProducts = () => [...products];
export const updateProduct = (updated: Product) => {
  products = products.map(p => p.id === updated.id ? updated : p);
};
export const addProduct = (product: Omit<Product, 'id'>) => {
  const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
  products.push(newProduct);
};
export const deleteProduct = (id: string) => {
  products = products.filter(p => p.id !== id);
};

// CRUD Order
export const getOrders = () => [...orders];
export const updateOrder = (updated: Order) => {
  orders = orders.map(o => o.id === updated.id ? updated : o);
};
export const updateOrderStatus = (id: string, status: OrderStatus) => {
  orders = orders.map(o => o.id === id ? { ...o, status } : o);
};

// CRUD Customer
export const getCustomers = () => [...customers];
