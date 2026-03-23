import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../../types'; 
import { Grid, Search } from 'lucide-react'; 
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
  const [searchTerm, setSearchTerm] = useState(''); 

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        // 🪄 Remplacement de p.category par p.category_name (ou en forçant la lecture avec un fallback)
        const matchesCategory = activeTab === 'Tous' || p.category_name === activeTab || (p as any).category === activeTab; 
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
  }, [products, activeTab, searchTerm]);

  return (
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
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none transition-all theme-input-sidebar"
            />
        </div>
      </div>

      {/* En-tête Catégories */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
           <Grid size={14} /> Catégories
        </h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          
          {/* Bouton "Tous" */}
           <button
              onClick={() => setActiveTab('Tous')}
              style={activeTab === 'Tous' ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                activeTab === 'Tous' 
                ? 'text-white shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover-border-theme'
              }`}
            >
              Tous
           </button>

          {/* Les Vraies Catégories */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.name)} 
              style={activeTab === cat.name ? { 
                  color: 'var(--theme-primary)', 
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)'
              } : {}}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                activeTab === cat.name 
                ? '' 
                : 'bg-white text-gray-600 border-gray-200 hover-border-theme'
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
                style={selectedProductId === product.id ? {
                    borderColor: 'var(--theme-primary)',
                    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)',
                    '--tw-ring-color': 'var(--theme-primary)'
                } as React.CSSProperties : {}}
                className={`w-full group text-left rounded-2xl overflow-hidden border transition-all p-2 flex items-center gap-3 ${
                    selectedProductId === product.id 
                    ? 'ring-1' 
                    : 'border-gray-100 hover:shadow-sm bg-white hover-border-theme'
                }`}
                >
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 relative">
                        <img 
                            src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : BASE_IMG_URL + product.image_url) : ''} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 
                            className={`text-sm font-bold truncate ${selectedProductId === product.id ? '' : 'text-gray-800'}`}
                            style={selectedProductId === product.id ? { color: 'var(--theme-primary)' } : {}}
                        >
                            {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{product.price} FCFA</p>
                    </div>
                    
                    {/* Indicateur de sélection */}
                    {selectedProductId === product.id && (
                        <div 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                        ></div>
                    )}
                </button>
            ))
        ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
                Aucun produit trouvé.
            </div>
        )}
      </div>

      {/* 🪄 STYLES DYNAMIQUES */}
      <style>{`
        .theme-input-sidebar:focus {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 20%, transparent) !important;
        }
        .hover-border-theme:hover {
            border-color: color-mix(in srgb, var(--theme-primary) 40%, transparent) !important;
        }
      `}</style>
    </div>
  );
};

export default SidebarLeft;