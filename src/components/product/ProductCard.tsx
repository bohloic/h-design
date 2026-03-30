import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Heart, AlertCircle } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../constants'; 
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { useWishlistStore } from '@/src/store/useWishlistStore';

// 🎨 PALETTE DE COULEURS (Référence)
const TEXTILE_COLORS_MAP: Record<string, string> = {
  "Blanc": "#FFFFFF", "Noir": "#000000", "Gris Chiné": "#9CA3AF", "Gris Anthracite": "#374151",
  "Bleu Marine": "#172554", "Bleu Roi": "#2563EB", "Bleu Ciel": "#93C5FD", "Rouge": "#DC2626",
  "Bordeaux": "#7F1D1D", "Vert Forêt": "#14532D", "Vert Pomme": "#22C55E", "Jaune": "#EAB308",
  "Orange": "#EA580C", "Rose": "#EC4899", "Violet": "#7C3AED", "Marron": "#451a03"
};

const getColorHex = (name: string): string => {
  if (!name) return '#000000';
  const cleanName = name.trim();
  if (TEXTILE_COLORS_MAP[cleanName]) return TEXTILE_COLORS_MAP[cleanName];
  const foundKey = Object.keys(TEXTILE_COLORS_MAP).find(k => k.toLowerCase() === cleanName.toLowerCase());
  return foundKey ? TEXTILE_COLORS_MAP[foundKey] : '#000000'; 
};

interface ProductCardProps {
  product: any;
  onAddToCart: (product: any) => void;
  navigate?: any; 
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [displayImage, setDisplayImage] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const isInWishlist = useWishlistStore(state => state.isInWishlist(product.id));

  // 🔴 VARIABLE DE STOCK
  const isOutOfStock = product.stock <= 0;

  const getAllColors = () => {
      const colors = [];
      const seenColors = new Set(); 

      const mainColorName = product.color || product.mainColor;
      
      if (mainColorName) {
          const hex = getColorHex(mainColorName);
          colors.push({
              id: 'main',
              colorName: mainColorName,
              finalColor: hex,
              image: product.image || product.image_url 
          });
          seenColors.add(mainColorName.toLowerCase().trim());
      }

      if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((v: any) => {
              const vName = v.colorName || v.color_name;
              
              if (vName && !seenColors.has(vName.toLowerCase().trim())) {
                  let vHex = v.colorCode || v.color_code || v.hex;
                  if (!vHex || vHex === '#FFFFFF' || vHex === '#000000') {
                      vHex = getColorHex(vName);
                  }

                  let vImages = [];
                  try {
                      vImages = Array.isArray(v.images) ? v.images : (typeof v.images === 'string' ? JSON.parse(v.images) : []);
                  } catch(e) { vImages = []; }
                  
                  colors.push({
                      id: v.id || vName,
                      colorName: vName,
                      finalColor: vHex,
                      image: vImages.length > 0 ? vImages[0] : null
                  });
                  seenColors.add(vName.toLowerCase().trim());
              }
          });
      }
      return colors;
  };

  const displayColors = getAllColors();

  useEffect(() => {
      let img = product.image || product.image_url || '';
      if (!img && displayColors.length > 0 && displayColors[0].image) {
          img = displayColors[0].image;
      }
      setDisplayImage(img);
  }, [product]);

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.hasOptions) {
      navigate(`/boutique/produit/${product.slug}`);
    } else {
      if (!isOutOfStock) onAddToCart(product); 
    }
  };

  const handleVariantHover = (e: React.MouseEvent, variantImage: string) => {
    e.stopPropagation();
    if (variantImage) setDisplayImage(variantImage);
  };

  const handleMouseLeave = () => {
      const baseImg = product.image || product.image_url || '';
      setDisplayImage(baseImg);
  };

  return (
    <div 
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => navigate(`/boutique/produit/${product.slug}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); handleMouseLeave(); }}
    >
      {/* IMAGE */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-black/20">
        
        {/* 🔴 BADGE ÉPUISÉ (Reste sémantiquement rouge) */}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-600/95 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm z-20 flex items-center gap-1 backdrop-blur-md">
            <AlertCircle size={12} strokeWidth={3} />
            ÉPUISÉ
          </div>
        )}

        <img 
          src={displayImage && displayImage.startsWith('http') ? displayImage : BASE_IMG_URL + displayImage} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
        
        {product.hasOptions && !isOutOfStock && (
            <div className="absolute top-2 left-2 bg-slate-800/80 dark:bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm z-10">
                OPTIONS
            </div>
        )}

        {/* ACTIONS */}
        <div className={`absolute bottom-3 left-0 right-0 flex justify-center gap-3 transition-all duration-300 transform z-20 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <button 
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                className={`bg-white dark:bg-carbon p-2.5 rounded-full shadow-lg transition-colors ${isInWishlist ? 'text-rose-500' : 'text-slate-900 dark:text-pure card-hover-theme-heart'}`}
                title={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
                <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
            </button>
            
            <button 
                onClick={handleQuickAction}
                disabled={isOutOfStock && !product.hasOptions}
                className={`p-2.5 rounded-full shadow-lg transition-colors flex items-center gap-2 px-4 ${
                  isOutOfStock && !product.hasOptions
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 dark:bg-slate-900 text-white card-hover-theme-btn'
                }`}
                title={isOutOfStock && !product.hasOptions ? "Épuisé" : (product.hasOptions ? "Choisir options" : "Ajouter au panier")}
            >
                {isOutOfStock && !product.hasOptions ? (
                    <AlertCircle size={18} />
                ) : product.hasOptions ? (
                    <Eye size={18} />
                ) : (
                    <ShoppingCart size={18} />
                )}
                <span className="text-xs font-bold hidden sm:inline">
                    {isOutOfStock && !product.hasOptions ? 'Épuisé' : (product.hasOptions ? 'Voir' : 'Ajouter')}
                </span>
            </button>
        </div>
      </div>

      {/* INFO */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate mb-1">
            {product.category || product.category_name}
        </div>
        
        <h3 className={`font-bold text-sm sm:text-base mb-2 truncate leading-tight transition-colors ${isOutOfStock ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-pure'}`}>
            {product.name}
        </h3>

        {/* VARIANTES + MAIN COLOR */}
        <div className="h-6 mb-2">
            {displayColors.length > 0 ? (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1" onClick={(e) => e.stopPropagation()}>
                    {displayColors.map((v: any, idx: number) => (
                        <button
                            key={v.id || idx}
                            className={`w-4 h-4 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-125 focus:outline-none ring-1 ring-transparent hover:ring-slate-300 relative ${v.colorName === 'Blanc' ? 'bg-white' : ''}`}
                            style={{ backgroundColor: v.finalColor }}
                            title={v.colorName}
                            onMouseEnter={(e) => v.image && handleVariantHover(e, v.image)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if(v.image) setDisplayImage(v.image);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">Unique</div>
            )}
        </div>
        
        <div className="flex items-center justify-between mt-auto">
            {/* 🪄 PRIX DYNAMIQUE */}
            <span 
                className={`text-sm sm:text-lg font-black ${isOutOfStock ? 'text-slate-400' : ''}`}
                style={!isOutOfStock ? { color: 'var(--theme-primary)' } : {}}
            >
                {formatCurrency(product.price)}
            </span>
        </div>
      </div>

      {/* 🪄 STYLES DYNAMIQUES POUR LA CARTE */}
      <style>{`
        .card-hover-theme-heart:hover {
            color: var(--theme-primary) !important;
            background-color: color-mix(in srgb, var(--theme-primary) 10%, white) !important;
        }
        .card-hover-theme-btn:hover {
            background-color: var(--theme-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;