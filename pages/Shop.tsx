import React, { useState, useMemo, useEffect } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { Product } from '../types'; 
import { Filter, Search, X, SlidersHorizontal, ArrowUpDown, Users, Palette, Ruler, Shirt } from 'lucide-react'; 
import ProductCard from '../src/components/product/ProductCard'; 

interface ShopProps {
  onAddToCart: (product: Product) => void;
}

// 🎨 PALETTE STANDARD
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
  
  // ==================== 1. ÉTATS ====================
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ==================== 2. FILTRES DISPO ====================
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<typeof TEXTILE_COLORS>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); 
  const [collections, setCollections] = useState<string[]>(['Toutes']);
  
  const genders = ['Tous', 'Homme', 'Femme', 'Enfant', 'Unisexe'];

  // ==================== 3. FILTRES ACTIFS ====================
  const [activeCollection, setActiveCollection] = useState<string>('Toutes');
  const [activeGender, setActiveGender] = useState<string>('Tous');
  const [activeCategory, setActiveCategory] = useState<string>('Toutes');
  const [activeSize, setActiveSize] = useState<string>('Toutes');
  const [activeColor, setActiveColor] = useState<string>('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');

  // ==================== 4. CHARGEMENT ====================
  useEffect(() => {
    // Bloquer le scroll du body quand le filtre mobile est ouvert
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
                try { sizes = JSON.parse(p.sizes); } catch(e) { sizes = []; }
            }

            let variants = [];
             if (Array.isArray(p.variants)) variants = p.variants;
            else if (typeof p.variants === 'string') {
                try { variants = JSON.parse(p.variants); } catch(e) { variants = []; }
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
        setAvailableColors([{name: 'Toutes', hex: '', border: false}, ...activeStandardColors]);

      } catch (error) {
        console.error("❌ Erreur Chargement Boutique:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==================== 5. FILTRAGE ====================
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
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium tracking-widest uppercase text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 min-h-screen bg-white">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">La Boutique</h1>
          <p className="text-slate-500 text-lg">Trouvez le T-shirt parfait pour votre style.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input 
            type="text" placeholder="Rechercher..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
        </div>
      </div>

      {/* BARRE MOBILE */}
      <div className="lg:hidden mb-6 flex gap-3 sticky top-[70px] z-30 bg-white/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-100 shadow-sm">
         <button 
            onClick={() => setIsMobileFilterOpen(true)} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform text-sm"
        >
            <SlidersHorizontal size={16} /> Filtres
        </button>
        <div className="flex-1 relative">
            <select 
                value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-sm appearance-none"
            >
                <option value="default">Pertinence</option>
                <option value="priceAsc">Prix: - cher</option>
                <option value="priceDesc">Prix: + cher</option>
            </select>
            <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
        
        {/* SIDEBAR (Desktop: Static, Mobile: Fixed Flex Column) */}
        {/* Cette structure 'flex-col' empêche le scroll derrière le header */}
        <aside className={`
            fixed inset-0 z-[60] bg-white transition-transform duration-300
            flex flex-col h-full
            lg:static lg:h-auto lg:w-72 lg:bg-transparent lg:block lg:z-auto lg:translate-x-0
            ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          
          {/* Header Sidebar Mobile (Fixe, ne scrolle pas) */}
          <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white lg:hidden">
            <h2 className="text-xl font-black text-slate-900 uppercase">Filtres</h2>
            <button 
                onClick={() => setIsMobileFilterOpen(false)} 
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600"
            >
                <X size={20} />
            </button>
          </div>

          {/* CONTENU FILTRES (C'est lui qui scrolle) */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-0 lg:overflow-visible">
            
            {/* Tri (Desktop) */}
            <div className="hidden lg:block pb-6 border-b border-slate-100">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><ArrowUpDown size={14} /> Trier par</h3>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium cursor-pointer outline-none hover:border-slate-300 transition-colors">
                    <option value="default">Pertinence</option>
                    <option value="priceAsc">Prix croissant</option>
                    <option value="priceDesc">Prix décroissant</option>
                </select>
            </div>

            {/* GENRE */}
            <div className="mb-8">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Users size={14} /> Genre</h3>
              <div className="flex flex-wrap gap-2">
                {genders.map(gender => (
                  <button 
                    key={gender} onClick={() => setActiveGender(gender)} 
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${
                        activeGender === gender 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
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
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeCategory === cat 
                        ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
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
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all border ${
                        activeSize === size 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
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
                    className={`w-9 h-9 rounded-full border shadow-sm transition-transform flex items-center justify-center ${
                        activeColor === col.name ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: col.name === 'Toutes' ? 'transparent' : col.hex }}
                  >
                     {col.name === 'Toutes' && <span className="text-[10px] font-bold text-slate-500">All</span>}
                     {activeColor === col.name && col.name !== 'Toutes' && <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${col.name === 'Blanc' || col.name === 'Jaune' ? 'bg-slate-900' : 'bg-white'}`}/>}
                  </button>
                ))}
              </div>
            </div>

            {/* COLLECTIONS */}
            <div className="pt-6 border-t border-slate-100 mb-8">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><Filter size={14} /> Collections</h3>
              <div className="space-y-2">
                {collections.map(col => (
                  <button 
                    key={col} onClick={() => { setActiveCollection(col); setIsMobileFilterOpen(false); }} 
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeCollection === col 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </aside>

        {/* Overlay Mobile */}
        {isMobileFilterOpen && <div className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />}

        {/* MAIN */}
        <main className="flex-1 min-h-[50vh]">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 mx-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Essayez de modifier vos filtres ou cherchez un autre terme.</p>
              <button onClick={resetFilters} className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Tout réinitialiser
              </button>
            </div>
          ) : (
            <>
                <div className="mb-6 px-1">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <span className="text-slate-500 font-medium text-sm">{filteredProducts.length} articles</span>
                        <div className="flex flex-wrap gap-2">
                            {activeGender !== 'Tous' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">Genre: {activeGender} <button onClick={() => setActiveGender('Tous')}><X size={12}/></button></span>}
                            {activeCategory !== 'Toutes' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">{activeCategory} <button onClick={() => setActiveCategory('Toutes')}><X size={12}/></button></span>}
                            {activeSize !== 'Toutes' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">Taille: {activeSize} <button onClick={() => setActiveSize('Toutes')}><X size={12}/></button></span>}
                            {activeColor !== 'Toutes' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">Couleur: {activeColor} <button onClick={() => setActiveColor('Toutes')}><X size={12}/></button></span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pb-12">
                    {filteredProducts.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onAddToCart={onAddToCart} 
                        />
                    ))}
                </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;