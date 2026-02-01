import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../constants'; 
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

// 🎨 PALETTE DE COULEURS (Référence)
const TEXTILE_COLORS_MAP: Record<string, string> = {
  "Blanc": "#FFFFFF", "Noir": "#000000", "Gris Chiné": "#9CA3AF", "Gris Anthracite": "#374151",
  "Bleu Marine": "#172554", "Bleu Roi": "#2563EB", "Bleu Ciel": "#93C5FD", "Rouge": "#DC2626",
  "Bordeaux": "#7F1D1D", "Vert Forêt": "#14532D", "Vert Pomme": "#22C55E", "Jaune": "#EAB308",
  "Orange": "#EA580C", "Rose": "#EC4899", "Violet": "#7C3AED", "Marron": "#451a03"
};

// Fonction utilitaire pour trouver le code Hex sans se soucier des majuscules/minuscules
const getColorHex = (name: string): string => {
  if (!name) return '#000000';
  const cleanName = name.trim();
  // 1. Essai direct
  if (TEXTILE_COLORS_MAP[cleanName]) return TEXTILE_COLORS_MAP[cleanName];
  // 2. Essai insensible à la casse (ex: "rouge" trouve "Rouge")
  const foundKey = Object.keys(TEXTILE_COLORS_MAP).find(k => k.toLowerCase() === cleanName.toLowerCase());
  return foundKey ? TEXTILE_COLORS_MAP[foundKey] : '#000000'; // Noir par défaut si introuvable
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

  // --- 1. FONCTION INTELLIGENTE POUR RÉCUPÉRER TOUTES LES COULEURS ---
  const getAllColors = () => {
      const colors = [];
      const seenColors = new Set(); // Pour éviter les doublons

      // A. Ajouter la COULEUR PRINCIPALE (Celle du produit lui-même)
      // On vérifie 'color' (venant de la DB) ou 'mainColor' (calculé)
      const mainColorName = product.color || product.mainColor;
      
      if (mainColorName) {
          const hex = getColorHex(mainColorName);
          
          colors.push({
              id: 'main',
              colorName: mainColorName,
              finalColor: hex,
              image: product.image || product.image_url // Image par défaut
          });
          seenColors.add(mainColorName.toLowerCase().trim());
      }

      // B. Ajouter les VARIANTES
      if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((v: any) => {
              const vName = v.colorName || v.color_name;
              
              // On ajoute seulement si on ne l'a pas déjà mis via la couleur principale
              if (vName && !seenColors.has(vName.toLowerCase().trim())) {
                  
                  // On cherche le code Hex (soit dans la variante, soit dans la Map)
                  let vHex = v.colorCode || v.color_code || v.hex;
                  // Si le code hex est invalide ou absent, on le cherche dans la Map par le nom
                  if (!vHex || vHex === '#FFFFFF' || vHex === '#000000') {
                      vHex = getColorHex(vName);
                  }

                  // Nettoyage des images de la variante
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

  // Initialisation Image au chargement
  useEffect(() => {
      let img = product.image || product.image_url || '';
      // Si pas d'image principale, on prend celle de la 1ère variante disponible
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
      onAddToCart(product);
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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => navigate(`/boutique/produit/${product.slug}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); handleMouseLeave(); }}
    >
      {/* IMAGE */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img 
          src={displayImage && displayImage.startsWith('http') ? displayImage : BASE_IMG_URL + displayImage} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
        
        {product.hasOptions && (
            <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                OPTIONS
            </div>
        )}

        {/* ACTIONS */}
        <div className={`absolute bottom-3 left-0 right-0 flex justify-center gap-3 transition-all duration-300 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <button 
                onClick={(e) => { e.stopPropagation(); /* Favoris logic */ }}
                className="bg-white text-slate-900 p-2.5 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Ajouter aux favoris"
            >
                <Heart size={18} />
            </button>
            <button 
                onClick={handleQuickAction}
                className="bg-slate-900 text-white p-2.5 rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2 px-4"
                title={product.hasOptions ? "Choisir options" : "Ajouter au panier"}
            >
                {product.hasOptions ? <Eye size={18} /> : <ShoppingCart size={18} />}
                <span className="text-xs font-bold hidden sm:inline">{product.hasOptions ? 'Voir' : 'Ajouter'}</span>
            </button>
        </div>
      </div>

      {/* INFO */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-widest truncate mb-1">
            {product.category || product.category_name}
        </div>
        
        <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-2 truncate leading-tight">
            {product.name}
        </h3>

        {/* VARIANTES + MAIN COLOR (Affichage des bulles) */}
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
                <div className="text-[10px] text-slate-300 italic">Unique</div>
            )}
        </div>
        
        <div className="flex items-center justify-between mt-auto">
            <span className="text-sm sm:text-lg font-black text-red-600">
                {formatCurrency(product.price)}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;