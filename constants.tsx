
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'T-shirt Signature H-Designer',
    description: 'Le t-shirt emblématique de notre atelier, 100% coton bio de qualité premium.',
    price: 15000,
    category: 'T-shirts',
    image: 'https://picsum.photos/seed/hdes1/600/800',
    isFeatured: true
  },
  {
    id: '2',
    name: 'Robe d\'Été Élégante',
    description: 'Une pièce fluide et chic, parfaite pour vos soirées estivales.',
    price: 35000,
    category: 'Femmes',
    image: 'https://picsum.photos/seed/hdes2/600/800',
    isNew: true
  },
  {
    id: '3',
    name: 'Costume Homme Sur Mesure',
    description: 'Le savoir-faire de l\'atelier H-designer pour vos grandes occasions.',
    price: 85000,
    category: 'Hommes',
    image: 'https://picsum.photos/seed/hdes3/600/800'
  },
  {
    id: '4',
    name: 'T-shirt Enfant Fun',
    description: 'Confort et style pour les petits avec des motifs uniques.',
    price: 12000,
    category: 'Enfants',
    image: 'https://picsum.photos/seed/hdes4/600/800'
  },
  {
    id: '5',
    name: 'Écharpe en Soie',
    description: 'Une touche d\'élégance pour sublimer vos tenues.',
    price: 25000,
    category: 'Accessoires',
    image: 'https://picsum.photos/seed/hdes5/600/800'
  },
  {
    id: '6',
    name: 'Casquette Premium Ligne H',
    description: 'Accessoire incontournable pour un look urbain chic.',
    price: 15000,
    category: 'Accessoires',
    image: 'https://picsum.photos/seed/hdes6/600/800'
  },
  {
    id: '7',
    name: 'Veste de Mi-saison',
    description: 'Style et légèreté pour une allure moderne.',
    price: 65000,
    category: 'Hommes',
    image: 'https://picsum.photos/seed/hdes7/600/800'
  },
  {
    id: '8',
    name: 'Sneakers Minimalistes',
    description: 'Confort absolu et design épuré pour tous les jours.',
    price: 45000,
    category: 'Chaussures',
    image: 'https://picsum.photos/seed/hdes8/600/800'
  }
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA');
};
