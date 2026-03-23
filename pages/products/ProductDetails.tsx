import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, Star, Truck,  
    Ruler, Loader2, Palette, Share2, Check, AlertCircle 
} from 'lucide-react'; 
import { useParams, useNavigate } from 'react-router-dom'; 
import { formatCurrency } from '@/constants';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import GenderCategorySection from '@/src/components/product/GenderCategorySection';
import ProductCarousel from '@/src/components/product/ProductCarousel';

const TEXTILE_COLORS_MAP: Record<string, string> = {
  "Blanc": "#FFFFFF", "Noir": "#000000", "Gris Chiné": "#9CA3AF", "Gris Anthracite": "#374151",
  "Bleu Marine": "#172554", "Bleu Roi": "#2563EB", "Bleu Ciel": "#93C5FD", "Rouge": "#DC2626",
  "Bordeaux": "#7F1D1D", "Vert Forêt": "#14532D", "Vert Pomme": "#22C55E", "Jaune": "#EAB308",
  "Orange": "#EA580C", "Rose": "#EC4899", "Violet": "#7C3AED", "Marron": "#451a03"
};

const getColorHex = (name: string): string => {
  if (!name) return '#000000';
  if (TEXTILE_COLORS_MAP[name]) return TEXTILE_COLORS_MAP[name];
  const key = Object.keys(TEXTILE_COLORS_MAP).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? TEXTILE_COLORS_MAP[key] : '#000000';
};

interface ProductVariant {
  id: number | string;
  colorName: string;
  colorCode: string;
  images: string[];
  stock_quantity?: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category_id: number;
  category_name: string;
  rating: number;     
  reviewsCount: number;
  sizes: string[];    
  variants: ProductVariant[];
  image_url: string;  
  collection_id?: number; 
}

interface ProductDetailsProps {
  onAddToCart: (product: any) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({onAddToCart}) => {
  const { slug } = useParams();  
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  const availableStock = selectedVariant?.stock_quantity || 0;
  const isOutOfStock = availableStock <= 0;

  useEffect(() => {
    if (selectedVariant) {
        if (availableStock <= 0) {
            setQuantity(1); 
        } else if (quantity > availableStock) {
            setQuantity(availableStock);
        }
    }
  }, [selectedVariant, availableStock]);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) throw new Error("Produit introuvable");
        const rawData = await response.json();

        let parsedSizes = [];
        try {
            parsedSizes = typeof rawData.attributes === 'string' ? JSON.parse(rawData.attributes) : rawData.attributes || [];
        } catch (e) { console.error(e); }

        const allVariants: ProductVariant[] = [];
        const seenColors = new Set<string>();

        if (rawData.image_url) {
            const mainColorName = rawData.color || "Standard";
            const mainVariant: ProductVariant = {
                id: 'main', 
                colorName: mainColorName,
                colorCode: getColorHex(mainColorName),
                images: [rawData.image_url],
                stock_quantity: rawData.stock_quantity
            };
            allVariants.push(mainVariant);
            seenColors.add(mainColorName.toLowerCase());
        }

        if (rawData.variants && Array.isArray(rawData.variants)) {
            rawData.variants.forEach((v: any) => {
                const vName = v.colorName || v.color_name;
                if (vName && !seenColors.has(vName.toLowerCase())) {
                    let vImages = [];
                    try { vImages = typeof v.images === 'string' ? JSON.parse(v.images) : v.images; } catch(e) { vImages = []; }
                    if (vImages.length === 0 && rawData.image_url) vImages = [rawData.image_url];

                    allVariants.push({
                        id: v.id,
                        colorName: vName,
                        colorCode: getColorHex(vName),
                        images: vImages,
                        stock_quantity: v.stock_quantity 
                    });
                    seenColors.add(vName.toLowerCase());
                }
            });
        }

        const cleanProduct: Product = {
            id: rawData.id,
            name: rawData.name,
            price: Number(rawData.price),
            description: rawData.description,
            category_id: rawData.category_id,
            category_name: rawData.category_name,
            rating: 4.8, 
            reviewsCount: rawData.view_count || 0,
            sizes: parsedSizes.length > 0 ? parsedSizes : ['S', 'M', 'L', 'XL', 'XXL'],
            variants: allVariants,
            image_url: rawData.image_url,
            collection_id: rawData.collection_id
        };

        setProduct(cleanProduct);
        if (allVariants.length > 0) setSelectedVariant(allVariants[0]);
        
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if(slug) fetchProduct();
  }, [slug]);

  useEffect(() => {
      if (!product) return;
      try {
          const stored = localStorage.getItem('recentlyViewed');
          let history = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(history)) history = [];

          history = history.filter((p: any) => p.id !== product.id);
          
          const minimalProduct = {
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              category: product.category_name,
              slug: slug
          };
          
          history.unshift(minimalProduct);
          if (history.length > 8) history = history.slice(0, 8);
          
          localStorage.setItem('recentlyViewed', JSON.stringify(history));
          setRecentProducts(history.filter((p: any) => p.id !== product.id));
      } catch (error) { console.error(error); }
  }, [product, slug]);

  const handleCustomize = () => {
    if (!product) return;
    const customizationData = {
      productId: product.id,
      variantId: selectedVariant?.id, 
      colorName: selectedVariant?.colorName
    };
    navigate('/personnaliser/mon-design', { state: customizationData });
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    if (isOutOfStock) return; 
    if (!selectedSize) { alert("⚠️ Veuillez sélectionner une taille !"); return; }

    const uniqueCartId = `${product.id}-${selectedVariant.id}-${selectedSize}`;
    const isMainProduct = selectedVariant.id === 'main';

    const cartItemPayload = {
      id: uniqueCartId, 
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: selectedVariant.images[0],
      options: {
        size: selectedSize,
        color: selectedVariant.colorName, 
        variant_id: isMainProduct ? null : selectedVariant.id, 
        customization: null, 
      }
    };
    onAddToCart(cartItemPayload); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--theme-primary)' }} /></div>;
  if (!product) return <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">Produit introuvable</div>;

  const displayImage = selectedVariant && selectedVariant.images.length > 0 ? selectedVariant.images[currentImageIndex] : "/placeholder.png";

  return (
    <div className="bg-white min-h-screen pb-16 animate-in fade-in duration-500">
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        
        {/* VUE PRINCIPALE */}
        <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-12 items-start">
          
          {/* --- GAUCHE : VISUEL --- */}
          <div className="flex flex-col gap-4 md:sticky md:top-24 mb-4 md:mb-0">
            
            <div className="relative w-full h-[40vh] md:h-auto md:aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in">
              <img 
                src={displayImage.startsWith('http') ? displayImage : BASE_IMG_URL + displayImage} 
                alt={product.name} 
                className={`w-full h-full object-contain p-4 object-center transition-transform duration-500 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
              />
              {isOutOfStock && (
                  <div className="absolute top-4 left-4 bg-red-600/90 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm z-10 flex items-center gap-1.5 backdrop-blur-md">
                      <AlertCircle size={16} /> ÉPUISÉ
                  </div>
              )}
            </div>
            
            {selectedVariant && selectedVariant.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-center md:justify-start">
                {selectedVariant.images.map((img, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setCurrentImageIndex(idx)} 
                        className={`w-14 h-14 rounded-lg border overflow-hidden flex-shrink-0 transition-all ${
                            currentImageIndex === idx ? 'ring-1' : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                        }`}
                        style={currentImageIndex === idx ? { 
                            borderColor: 'var(--theme-primary)', 
                            '--tw-ring-color': 'var(--theme-primary)' 
                        } as React.CSSProperties : {}}
                    >
                        <img src={img.startsWith('http') ? img : BASE_IMG_URL + img} className="w-full h-full object-contain p-1" alt="" />
                    </button>
                ))}
                </div>
            )}
          </div>

          {/* --- DROITE : INFOS & ACTIONS --- */}
          <div className="flex flex-col gap-5">
            <div className="border-b border-slate-100 pb-4">
               <div className="flex justify-between items-start gap-4">
                   <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight flex-1">{product.name}</h1>
                   <button className="text-slate-400 hover-theme-text p-1"><Share2 size={20}/></button>
               </div>
               <div className="flex items-center justify-between mt-3">
                   <div className="flex items-center gap-2">
                        {/* 🪄 PRIX DYNAMIQUE */}
                        <span className="text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>{formatCurrency(product.price)}</span>
                        <span className="text-xs text-slate-500 font-medium">TTC</span>
                   </div>
                   <div className="flex items-center gap-1 text-amber-400 text-sm bg-amber-50 px-2 py-1 rounded-full">
                       {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                       <span className="text-xs text-amber-700 ml-1 font-medium">4.8/5</span>
                   </div>
               </div>
             </div>

            {/* Sélecteur Couleur */}
            <div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-bold text-slate-700">Couleur : <span className="font-normal capitalize">{selectedVariant?.colorName}</span></span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                    <button
                        key={variant.id}
                        onClick={() => { setSelectedVariant(variant); setCurrentImageIndex(0); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
                            selectedVariant?.id === variant.id ? 'ring-2 ring-offset-2 scale-110 border-transparent' : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={variant.colorName}
                        style={{ 
                            backgroundColor: variant.colorCode,
                            ...(selectedVariant?.id === variant.id ? { '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties : {})
                        }}
                    >
                        {variant.colorName === 'Blanc' && <div className="absolute inset-0 rounded-full border border-black/10 pointer-events-none" />}
                        {selectedVariant?.id === variant.id && (
                            <Check size={16} className={['Blanc', 'Jaune'].includes(variant.colorName) ? 'text-slate-900' : 'text-white'} />
                        )}
                    </button>
                    ))}
                </div>
            </div>

            {/* Sélecteur Taille */}
            <div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-bold text-slate-700">
                        Taille : <span className="font-normal" style={!selectedSize ? { color: 'var(--theme-primary)' } : {}}>{selectedSize || 'Requise'}</span>
                    </span>
                    <button className="text-xs text-slate-500 underline hover-theme-text flex items-center gap-1"><Ruler size={12} /> Guide des tailles</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                        <button 
                            key={size} 
                            onClick={() => setSelectedSize(size)} 
                            className={`min-w-[3rem] h-10 px-2 rounded-md text-sm font-bold border transition-colors ${
                                selectedSize === size 
                                    ? 'text-white shadow-md' 
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                            style={selectedSize === size ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* MESSAGE DE STOCK */}
            {isOutOfStock ? (
                <div className="text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-red-100">
                    <AlertCircle size={18} /> Rupture de stock pour cette couleur.
                </div>
            ) : (availableStock <= 5 && availableStock > 0) ? (
                <div className="text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-amber-100">
                    <AlertCircle size={18} /> Plus que {availableStock} article(s) en stock !
                </div>
            ) : null}

            {/* Actions */}
            <div className="space-y-3 pt-2">
                <div className="flex gap-3 h-12">
                    
                    <div className="flex items-center border border-slate-300 rounded-lg w-28 bg-white flex-shrink-0 overflow-hidden">
                        <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                            disabled={isOutOfStock || quantity <= 1}
                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-100 font-bold text-lg transition-colors"
                        >
                            -
                        </button>
                        <span className={`flex-1 text-center font-bold text-base ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
                            {isOutOfStock ? 0 : quantity}
                        </span>
                        <button 
                            onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} 
                            disabled={isOutOfStock || quantity >= availableStock}
                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-100 font-bold text-lg transition-colors"
                        >
                            +
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleAddToCart} 
                        disabled={!selectedSize || isOutOfStock} 
                        className={`flex-1 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                            isOutOfStock
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : !selectedSize 
                                ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        <ShoppingCart size={18} />
                        {isOutOfStock ? 'Épuisé' : (selectedSize ? 'Ajouter' : 'Choisir Taille')}
                    </button>
                </div>

                {/* 🪄 BOUTON PERSONNALISER DYNAMIQUE */}
                <button 
                    onClick={handleCustomize} 
                    disabled={isOutOfStock}
                    style={!isOutOfStock ? { color: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                    className={`w-full h-10 border-2 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isOutOfStock 
                            ? 'border-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-white hover:bg-slate-50'
                    }`}
                >
                    <Palette size={16} /> Personnaliser ce design
                </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-3 border border-slate-100 mt-2">
                <div className="flex items-center gap-3 text-green-700 font-medium"><Truck size={18} /><span>Livraison disponible sous 24h/48h</span></div>
                <div className="pt-3 border-t border-slate-200"><p className="leading-relaxed text-xs sm:text-sm">{product.description}</p></div>
            </div>
          </div>
        </div>

        {/* --- SECTIONS RECOMMANDATIONS --- */}
        <div className="w-full mt-12 space-y-2">
            {product.collection_id && (
                <ProductCarousel 
                    title="Dans la même collection" 
                    endpoint={`/api/products/collection/${product.collection_id}`} 
                />
            )}
            <div className="pt-4">
                 <GenderCategorySection categoryId={product.category_id} title="Vous pourriez aussi aimer" />
            </div>
            {recentProducts.length > 0 && (
                <ProductCarousel 
                    title="Derniers articles consultés" 
                    staticProducts={recentProducts} 
                />
            )}
        </div>

      </div>

      <style>{`
        .hover-theme-text:hover {
            color: var(--theme-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;