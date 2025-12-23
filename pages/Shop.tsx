import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../constants'; // Garde tes utilitaires
import { Product } from '../types'; // Garde tes types
import { Filter, ShoppingCart, Heart, Search, X, Loader } from 'lucide-react';

interface ShopProps {
  onAddToCart: (product: Product) => void;
}

const Shop: React.FC<ShopProps> = ({ onAddToCart }) => {
  // --- ÉTATS ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Tous']);
  const [loading, setLoading] = useState(true);

  // États de filtrage
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');

  // --- CHARGEMENT DES DONNÉES (API) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. On lance les deux requêtes en parallèle pour gagner du temps
        const [productsRes, collectionsRes] = await Promise.all([
          fetch('http://localhost:205/api/products/shop'),
          fetch('http://localhost:205/api/collections/active')
        ]);

        const productsData = await productsRes.json();
        const collectionsData = await collectionsRes.json();

        // 2. Formatage des collections pour le menu
        const categoryNames = collectionsData.map((c: any) => c.name);
        setCategories(['Tous', ...categoryNames]);

        // 3. Formatage des produits (MySQL -> React)
        const formattedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          description: p.description,
          // On utilise l'URL de l'image stockée ou une image par défaut
          image: p.image_url || 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?auto=format&fit=crop&q=80',
          category: p.category_name || 'Autre', // Vient du JOIN SQL
          // Calcul automatique : Est-ce un nouveau produit ? (Moins de 30 jours)
          isNew: (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24) < 30
        }));

        setProducts(formattedProducts);
        setLoading(false);

      } catch (error) {
        console.error("Erreur chargement boutique:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOGIQUE DE FILTRAGE (Reste identique, mais sur 'products' dynamique) ---
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => activeCategory === 'Tous' || p.category === activeCategory)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        return 0;
      });
  }, [activeCategory, searchQuery, sortBy, products]);

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* En-tête et Recherche */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notre Boutique Festive</h1>
          <p className="text-slate-500">Trouvez le style qui vous fera rayonner pour les fêtes.</p>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Rechercher un vêtement..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600/20"
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters (DYNAMIQUE MAINTENANT) */}
        <aside className="w-full lg:w-64 space-y-8">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <Filter className="mr-2 w-5 h-5" /> Collections
            </h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
                    activeCategory === cat 
                    ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-600/20' 
                    : 'bg-white text-slate-600 hover:bg-red-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Trier par</h3>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="default">Pertinence</option>
              <option value="priceAsc">Prix croissant</option>
              <option value="priceDesc">Prix décroissant</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-xl text-slate-400">Aucun produit ne correspond à votre recherche.</p>
              <button 
                onClick={() => { setActiveCategory('Tous'); setSearchQuery(''); }}
                className="mt-4 text-red-600 font-bold hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map(product => (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="relative h-80 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {product.isNew && (
                      <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Nouveau
                      </span>
                    )}
                    <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-400 hover:text-red-600 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
                    <h3 className="font-bold text-lg mb-2 truncate">{product.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{product.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-black text-red-600">{formatCurrency(product.price)}</span>
                      <button 
                        onClick={() => onAddToCart(product)}
                        className="bg-slate-900 text-white p-3 rounded-xl hover:bg-red-600 transition-colors flex items-center space-x-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="hidden sm:inline text-sm font-bold">Ajouter</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;