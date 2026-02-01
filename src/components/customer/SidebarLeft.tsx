import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../../types'; 
import { Grid, Search } from 'lucide-react'; // Ajout de Search
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

interface SidebarLeftProps {
  products: Product[];
  categories: Category[]; 
  onSelectProduct: (p: Product) => void;
  selectedProductId?: number;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ 
  products, 
  categories, 
  onSelectProduct, 
  selectedProductId 
}) => {
  const [activeTab, setActiveTab] = useState<string>('Tous');
  const [searchTerm, setSearchTerm] = useState(''); // Ajout recherche locale

  // Filtrage dynamique (Catégorie + Recherche)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesCategory = activeTab === 'Tous' || p.category === activeTab; // Attention : vérifie si ton backend renvoie 'category' ou 'category_name'
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
  }, [products, activeTab, searchTerm]);

  return (
    // 1. Suppression de 'hidden lg:flex' pour laisser le parent gérer l'affichage responsive
    <div className="w-full h-full bg-white flex flex-col">
      
      {/* Barre de Recherche */}
      <div className="p-4 pb-0">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text"
                placeholder="Chercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
        </div>
      </div>

      {/* En-tête Catégories (Scrollable horizontalement sur mobile) */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
           <Grid size={14} /> Catégories
        </h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {/* Bouton "Tous" */}
           <button
              onClick={() => setActiveTab('Tous')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                activeTab === 'Tous' 
                ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-red-200'
              }`}
            >
              Tous
           </button>

          {/* Les Vraies Catégories */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.name)} // Assure-toi que p.category === cat.name
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                activeTab === cat.name 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-red-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Liste Produits */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
                <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`w-full group text-left rounded-2xl overflow-hidden border transition-all p-2 flex items-center gap-3 ${
                    selectedProductId === product.id 
                    ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500' 
                    : 'border-gray-100 hover:border-red-200 hover:shadow-sm bg-white'
                }`}
                >
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 relative">
                        <img 
                            src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : BASE_IMG_URL + product.image_url) : ''} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <div className="flex-1 min-w-0"> {/* min-w-0 pour le truncate */}
                        <h3 className={`text-sm font-bold truncate ${selectedProductId === product.id ? 'text-red-700' : 'text-gray-800'}`}>
                            {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{product.price} FCFA</p>
                    </div>
                    
                    {/* Indicateur de sélection */}
                    {selectedProductId === product.id && (
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    )}
                </button>
            ))
        ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
                Aucun produit trouvé.
            </div>
        )}
      </div>
    </div>
  );
};

export default SidebarLeft;