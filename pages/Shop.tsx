import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../src/utils/apiClient';
import { Product } from '../types';
import { Filter, Search, X, SlidersHorizontal, ArrowUpDown, Users, Palette, Ruler, Shirt } from 'lucide-react';
import ProductCard from '../src/components/product/ProductCard';
import Pagination from '../src/components/tools/Pagination';

interface ShopProps {
  onAddToCart: (product: Product) => void;
}

const TEXTILE_COLORS = [
  { name: "Blanc", hex: "#FFFFFF", border: true },
  { name: "Noir", hex: "#000000" },
  { name: "Gris Chiné", hex: "#9CA3AF" },
  { name: "Gris Anthracite", hex: "#374151" },
  { name: "Bleu Marine", hex: "#172554" },
  { name: "Bleu Roi", hex: "#2563EB" },
  { name: "Bleu Ciel", hex: "#93C5FD" },
  { name: "Rouge", hex: "#DC2626" },
  { name: "Bordeaux", hex: "#7F1D1D" },
  { name: "Vert Forêt", hex: "#14532D" },
  { name: "Vert Pomme", hex: "#22C55E" },
  { name: "Jaune", hex: "#EAB308" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Marron", hex: "#451a03" }
];

const Shop: React.FC<ShopProps> = ({ onAddToCart }) => {

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<typeof TEXTILE_COLORS>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>(['Toutes']);

  const location = useLocation();

  const genders = ['Tous', 'Homme', 'Femme', 'Enfant', 'Unisexe'];

  const [activeCollection, setActiveCollection] = useState<string>('Toutes');
  const [activeGender, setActiveGender] = useState<string>('Tous');
  const [activeCategory, setActiveCategory] = useState<string>('Toutes');
  const [activeSize, setActiveSize] = useState<string>('Toutes');
  const [activeColor, setActiveColor] = useState<string>('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // --- 🪄 GESTION DE L'ÉTAT DE NAVIGATION (FILTRAGE DISCRET DEPUIS L'ACCUEIL) ---
  useEffect(() => {
    const state = location.state as { gender?: string, category?: string } | null;

    if (state?.gender) {
      const foundGender = genders.find(g => g.toLowerCase() === state.gender?.toLowerCase());
      if (foundGender) setActiveGender(foundGender);
    }

    if (state?.category) {
      setActiveCategory(state.category);
    }
  }, [location.state]);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileFilterOpen]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, collectionsRes] = await Promise.all([
          authFetch('/api/products/shop'),
          authFetch('/api/collections')
        ]);

        const productsData = await productsRes.json();

        if (collectionsRes.ok) {
          const cData = await collectionsRes.json();
          setCollections(['Toutes', ...cData.map((c: any) => c.name)]);
        }

        const formattedProducts = productsData.map((p: any) => {
          let sizes = [];
          if (Array.isArray(p.sizes)) sizes = p.sizes;
          else if (typeof p.sizes === 'string') {
            try { sizes = JSON.parse(p.sizes); } catch (e) { sizes = []; }
          }

          let variants = [];
          if (Array.isArray(p.variants)) variants = p.variants;
          else if (typeof p.variants === 'string') {
            try { variants = JSON.parse(p.variants); } catch (e) { variants = []; }
          }

          const mainColorName = p.color || (variants.length > 0 ? variants[0].colorName : null);

          return {
            ...p,
            price: parseFloat(p.price),
            gender: p.gender ? p.gender.toLowerCase() : 'unisexe',
            category: p.category_name || 'Autre',
            collection: p.collection_name || 'Standard',
            hasOptions: variants.length > 0 || sizes.length > 0,
            variants: variants,
            sizes: sizes,
            mainColor: mainColorName
          };
        });

        setProducts(formattedProducts);

        const uniqueCats = Array.from(new Set(formattedProducts.map((p: any) => p.category))).sort();
        setAvailableCategories(['Toutes', ...uniqueCats as string[]]);

        const uniqueSizes = Array.from(new Set(formattedProducts.flatMap((p: any) => p.sizes || []))).sort();
        setAvailableSizes(['Toutes', ...uniqueSizes as string[]]);

        const usedColorNames = new Set<string>();
        formattedProducts.forEach((p: any) => {
          if (p.mainColor) usedColorNames.add(p.mainColor);
          if (p.variants) {
            p.variants.forEach((v: any) => {
              if (v.colorName) usedColorNames.add(v.colorName);
            });
          }
        });

        const activeStandardColors = TEXTILE_COLORS.filter(col => usedColorNames.has(col.name));
        setAvailableColors([{ name: 'Toutes', hex: '', border: false }, ...activeStandardColors]);

      } catch (error) {
        console.error("❌ Erreur Chargement Boutique:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchCollection = activeCollection === 'Toutes' || p.collection === activeCollection;
        const matchGender = activeGender === 'Tous' || p.gender === activeGender.toLowerCase();
        const matchCategory = activeCategory === 'Toutes' || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSize = activeSize === 'Toutes' || (p.sizes && p.sizes.includes(activeSize));

        const matchColor = activeColor === 'Toutes' ||
          p.mainColor === activeColor ||
          (p.variants && p.variants.some((v: any) => v.colorName === activeColor));

        return matchCollection && matchGender && matchCategory && matchSearch && matchSize && matchColor;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        return 0;
      });
  }, [activeCollection, activeGender, activeCategory, activeSize, activeColor, searchQuery, sortBy, products]);

  // 🪄 Slice pour la pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCollection, activeGender, activeCategory, activeSize, activeColor, searchQuery, sortBy]);

  const resetFilters = () => {
    setActiveGender('Tous');
    setActiveCollection('Toutes');
    setActiveCategory('Toutes');
    setActiveSize('Toutes');
    setActiveColor('Toutes');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-offwhite dark:bg-carbon text-slate-900 dark:text-pure">
        <div
          className="w-16 h-16 border-4 border-slate-200 dark:border-slate-100 rounded-full animate-spin mb-4"
          style={{ borderTopColor: 'var(--theme-primary)' }}
        ></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 min-h-screen bg-offwhite dark:bg-carbon text-slate-900 dark:text-pure transition-colors">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-pure mb-2 uppercase tracking-tight">La Boutique</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Trouvez la pièce parfaite pour votre style.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text" placeholder="Rechercher..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none transition-all shadow-sm theme-search-input text-slate-900 dark:text-pure placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 w-5 h-5" />
        </div>
      </div>

      {/* BARRE MOBILE */}
      <div className="lg:hidden mb-6 flex gap-3 sticky top-[70px] z-30 bg-white/95 dark:bg-carbon/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform text-sm border border-slate-200 dark:border-slate-700"
        >
          <SlidersHorizontal size={16} /> Filtres
        </button>
        <div className="flex-1 relative">
          <select
            value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium outline-none text-sm appearance-none text-slate-900 dark:text-pure transition-colors"
          >
            <option value="default">Pertinence</option>
            <option value="priceAsc">Prix: - cher</option>
            <option value="priceDesc">Prix: + cher</option>
          </select>
          <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">

        {/* SIDEBAR */}
        <aside className={`
            fixed inset-0 z-[60] bg-offwhite dark:bg-carbon transition-transform duration-300
            flex flex-col h-full
            lg:static lg:h-auto lg:w-72 lg:bg-transparent lg:block lg:z-auto lg:translate-x-0
            ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>

          {/* Header Sidebar Mobile */}
          <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-offwhite dark:bg-carbon lg:hidden transition-colors">
            <h2 className="text-xl font-black text-slate-900 dark:text-pure uppercase">Filtres</h2>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-0 lg:overflow-visible">

            {/* Tri (Desktop) */}
            <div className="hidden lg:block pb-6 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><ArrowUpDown size={14} /> Trier par</h3>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium cursor-pointer outline-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-slate-900 dark:text-pure">
                <option value="default">Pertinence</option>
                <option value="priceAsc">Prix croissant</option>
                <option value="priceDesc">Prix décroissant</option>
              </select>
            </div>

            {/* GENRE */}
            <div className="mb-8 mt-6 lg:mt-8">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Users size={14} /> Genre</h3>
              <div className="flex flex-wrap gap-2">
                {genders.map(gender => (
                  <button
                    key={gender} onClick={() => setActiveGender(gender)}
                    style={activeGender === gender ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${activeGender === gender
                        ? 'text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* COUPE */}
            <div className="mb-8">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Shirt size={14} /> Coupe</h3>
              <div className="space-y-2">
                {availableCategories.map(cat => (
                  <button
                    key={cat} onClick={() => setActiveCategory(cat)}
                    style={activeCategory === cat ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' } : {}}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat
                        ? 'shadow-sm border'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* TAILLE */}
            <div className="mb-8">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Ruler size={14} /> Taille</h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button
                    key={size} onClick={() => setActiveSize(size)}
                    style={activeSize === size ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all border ${activeSize === size
                        ? 'text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    {size === 'Toutes' ? 'All' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* COULEUR */}
            <div className="mb-8">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Palette size={14} /> Couleur</h3>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((col, idx) => (
                  <button
                    key={idx} onClick={() => setActiveColor(col.name)} title={col.name}
                    className={`w-9 h-9 rounded-full border shadow-sm transition-transform flex items-center justify-center ${activeColor === col.name ? 'ring-2 ring-offset-2 scale-110 border-transparent' : 'hover:scale-110'
                      }`}
                    style={{
                      backgroundColor: col.name === 'Toutes' ? 'transparent' : col.hex,
                      ...(activeColor === col.name ? { '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties : {})
                    }}
                  >
                    {col.name === 'Toutes' && <span className="text-[10px] font-bold text-slate-500">All</span>}
                    {activeColor === col.name && col.name !== 'Toutes' && <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${col.name === 'Blanc' || col.name === 'Jaune' ? 'bg-slate-900' : 'bg-white'}`} />}
                  </button>
                ))}
              </div>
            </div>

            {/* COLLECTIONS */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mb-8 transition-colors">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Filter size={14} /> Collections</h3>
              <div className="space-y-2">
                {collections.map(col => (
                  <button
                    key={col} onClick={() => { setActiveCollection(col); setIsMobileFilterOpen(false); }}
                    style={activeCollection === col ? { backgroundColor: 'var(--theme-primary)' } : {}}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCollection === col
                        ? 'text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {isMobileFilterOpen && <div className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />}

        {/* MAIN */}
        <main className="flex-1 min-h-[50vh]">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 mx-4 border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6 transition-colors">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-pure mb-2">Aucun résultat trouvé</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Essayez de modifier vos filtres ou cherchez un autre terme.</p>
              <button
                onClick={resetFilters}
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="px-8 py-3 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 opacity-95 hover:opacity-100"
              >
                Tout réinitialiser
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 px-1">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{filteredProducts.length} articles</span>
                  <div className="flex flex-wrap gap-2">
                    {activeGender !== 'Tous' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Genre: {activeGender} <button onClick={() => setActiveGender('Tous')}><X size={12} /></button></span>}
                    {activeCategory !== 'Toutes' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{activeCategory} <button onClick={() => setActiveCategory('Toutes')}><X size={12} /></button></span>}
                    {activeSize !== 'Toutes' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Taille: {activeSize} <button onClick={() => setActiveSize('Toutes')}><X size={12} /></button></span>}
                    {activeColor !== 'Toutes' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Couleur: {activeColor} <button onClick={() => setActiveColor('Toutes')}><X size={12} /></button></span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pb-12">
                {paginatedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              <Pagination 
                currentPage={currentPage}
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </main>
      </div>

      {/* 🪄 STYLE MAGIQUE POUR L'INPUT */}
      <style>{`
        .theme-search-input:focus {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 20%, transparent) !important;
        }
      `}</style>
    </div>
  );
};

export default Shop;