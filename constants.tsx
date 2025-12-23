
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pull de Noël Traditionnel',
    description: 'Un pull chaud et confortable avec des motifs de rennes pour toute la famille.',
    price: 15000,
    category: 'Noël',
    image: 'https://picsum.photos/seed/xmas1/600/800',
    isFeatured: true
  },
  {
    id: '2',
    name: 'Robe de Réveillon Rouge',
    description: 'Élégante robe en velours pour briller lors du réveillon de Noël.',
    price: 35000,
    category: 'Femmes',
    image: 'https://picsum.photos/seed/xmas2/600/800',
    isNew: true
  },
  {
    id: '3',
    name: 'Costume Homme Élégant',
    description: 'Parfait pour les grandes occasions de fin d\'année.',
    price: 85000,
    category: 'Hommes',
    image: 'https://picsum.photos/seed/xmas3/600/800'
  },
  {
    id: '4',
    name: 'Pyjama de Lutin',
    description: 'Le pyjama idéal pour les enfants le matin de Noël.',
    price: 12000,
    category: 'Enfants',
    image: 'https://picsum.photos/seed/xmas4/600/800'
  },
  {
    id: '5',
    name: 'Écharpe en Cachemire',
    description: 'Douceur et chaleur garanties pour les hivers frais.',
    price: 25000,
    category: 'Accessoires',
    image: 'https://picsum.photos/seed/xmas5/600/800'
  },
  {
    id: '6',
    name: 'Bonnet à Pompon Festif',
    description: 'Un accessoire indispensable pour vos sorties au marché de Noël.',
    price: 5000,
    category: 'Accessoires',
    image: 'https://picsum.photos/seed/xmas6/600/800'
  },
  {
    id: '7',
    name: 'Manteau d\'Hiver Chic',
    description: 'Style et protection contre le froid.',
    price: 65000,
    category: 'Hommes',
    image: 'https://picsum.photos/seed/xmas7/600/800'
  },
  {
    id: '8',
    name: 'Bottes de Neige Stylées',
    description: 'Marchez sur la neige avec élégance.',
    price: 45000,
    category: 'Femmes',
    image: 'https://picsum.photos/seed/xmas8/600/800'
  }
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA');
};
