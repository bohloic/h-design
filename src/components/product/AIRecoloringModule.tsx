import React, { useState } from 'react';
import { Palette, Check, ShoppingCart, Sparkles } from 'lucide-react';

export interface StandardVariant {
  id: string | number;
  name: string;
  hex: string;
  sku: string;
  inStock: boolean;
}

export interface AIRecoloringModuleProps {
  productId: number | string;
  productName: string;
  basePrice: number;
  originalImageUrl: string;
  clothingMaskUrl: string;
  standardVariants: StandardVariant[];
  onAddToCart: (cartPayload: {
    productId: number | string;
    productName: string;
    price: number;
    isCustomColor: boolean;
    variantId?: string | number;
    colorHex: string;
    colorName: string;
    customAttributes?: Record<string, string>;
  }) => void;
}

/**
 * 🎨 MODULE RECOLORING IA & GESTION DES VARIANTES / PERSONNALISATION
 * - Superposition 3 couches (Fond original, Masque de fusion couleur, Reliefs & Ombres)
 * - Rendu hyper-réaliste sur fonds complexes (conservation des plis et de la lumière)
 * - Double flux : Variantes stock vs Color Picker libre
 */
export const AIRecoloringModule: React.FC<AIRecoloringModuleProps> = ({
  productId,
  productName,
  basePrice,
  originalImageUrl,
  clothingMaskUrl,
  standardVariants,
  onAddToCart,
}) => {
  const [activeMode, setActiveMode] = useState<'variant' | 'custom'>('variant');
  const [selectedVariant, setSelectedVariant] = useState<StandardVariant | null>(
    standardVariants[0] || null
  );
  const [customHex, setCustomHex] = useState<string>('#FF5733');
  const [pantoneCode, setPantoneCode] = useState<string>('');

  // Détermine la couleur HEX active à appliquer sur le vêtement
  const activeHex = activeMode === 'variant' ? (selectedVariant?.hex || '#FFFFFF') : customHex;
  const isCustomColor = activeMode === 'custom';

  const handleAddToCart = () => {
    if (isCustomColor) {
      onAddToCart({
        productId,
        productName,
        price: basePrice + 2000, // Majoration éventuelle pour couleur personnalisée sur commande
        isCustomColor: true,
        colorHex: customHex,
        colorName: `Personnalisé (${customHex.toUpperCase()})`,
        customAttributes: {
          Couleur_Perso: customHex.toUpperCase(),
          Code_Pantone: pantoneCode.trim() || 'Non spécifié',
          Type_Production: 'Impression_Sur_Commande_IA',
        },
      });
    } else if (selectedVariant) {
      onAddToCart({
        productId,
        productName,
        price: basePrice,
        isCustomColor: false,
        variantId: selectedVariant.id,
        colorHex: selectedVariant.hex,
        colorName: selectedVariant.name,
        customAttributes: {
          SKU: selectedVariant.sku,
        },
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* =================================================================== */}
        {/* ÉTAPE 2 : UI & SUPERPOSITION CSS SUR FOND COMPLEXE                  */}
        {/* =================================================================== */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
          
          {/* COUCHE 1 (Arrière-plan) : Photo originale avec son fond complexe */}
          <img
            src={originalImageUrl}
            alt={productName}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* COUCHE 2 (Masque de fusion de couleur) : Masque transparent du vêtement avec couleur dynamique */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300 z-10"
            style={{
              backgroundColor: activeHex,
              WebkitMaskImage: `url(${clothingMaskUrl})`,
              maskImage: `url(${clothingMaskUrl})`,
              WebkitMaskSize: 'cover',
              maskSize: 'cover',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              mixBlendMode: 'multiply', // Conserve la luminosité et les ombres profondes
              opacity: 0.85,
            }}
          />

          {/* COUCHE 3 (Calque d'éclairage / Relief) : Rehaussage des plis & hautes lumières */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            style={{
              WebkitMaskImage: `url(${clothingMaskUrl})`,
              maskImage: `url(${clothingMaskUrl})`,
              WebkitMaskSize: 'cover',
              maskSize: 'cover',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              backgroundImage: `url(${clothingMaskUrl})`,
              backgroundSize: 'cover',
              mixBlendMode: 'overlay', // Restitue le grain et les textures du tissu
              opacity: 0.6,
            }}
          />

          {/* BADGE INDICATEUR DE MODE */}
          <div className="absolute top-3 left-3 z-30 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
            <Sparkles size={14} className="text-amber-400" />
            {isCustomColor ? 'Couleur IA Personnalisée' : 'Variante en Stock'}
          </div>
        </div>

        {/* =================================================================== */}
        {/* ÉTAPE 3 : LOGIQUE SELECTION (PASTILLES vs COLOR PICKER)              */}
        {/* =================================================================== */}
        <div className="flex flex-col space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {productName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Module de changement de couleur dynamique en temps réel.
            </p>
          </div>

          {/* SELECTEUR DE MODE */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveMode('variant')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                activeMode === 'variant'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Couleurs en Stock
            </button>
            <button
              onClick={() => setActiveMode('custom')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'custom'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Palette size={16} />
              Créer ma Couleur
            </button>
          </div>

          {/* FLUX 1 : PASTILLES VARIANTES EN STOCK */}
          {activeMode === 'variant' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Variantes disponibles
              </label>
              <div className="flex flex-wrap gap-3">
                {standardVariants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.inStock}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm ${
                        isSelected
                          ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-amber-400'
                          : 'border-transparent hover:scale-105'
                      } ${!variant.inStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: variant.hex }}
                      title={`${variant.name} (${variant.sku})`}
                    >
                      {isSelected && (
                        <Check
                          size={18}
                          className={
                            variant.hex.toLowerCase() === '#ffffff'
                              ? 'text-slate-900'
                              : 'text-white'
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedVariant && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2">
                  Couleur sélectionnée : <strong className="text-slate-900 dark:text-white">{selectedVariant.name}</strong> (SKU: {selectedVariant.sku})
                </p>
              )}
            </div>
          )}

          {/* FLUX 2 : COLOR PICKER LIBRE / NIANCIER IA */}
          {activeMode === 'custom' && (
            <div className="space-y-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
              <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                Palette & Color Picker Temps Réel
              </label>
              
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-14 h-14 rounded-xl cursor-pointer border-0 p-0 shadow-md bg-transparent"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={customHex.toUpperCase()}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="#FF5733"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Code Couleur Hexadécimal</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Code Pantone (Optionnel pour l'Atelier d'Impression)
                </label>
                <input
                  type="text"
                  value={pantoneCode}
                  onChange={(e) => setPantoneCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: Pantone 18-1662 TPX (Flame Scarlet)"
                />
              </div>
            </div>
          )}

          {/* CHAMP CACHÉ DE TRANSMISSION D'ÉTAT */}
          <input type="hidden" name="selected_color_hex" value={activeHex} />
          <input type="hidden" name="is_custom_color" value={isCustomColor ? 'true' : 'false'} />

          {/* BOUTON D'AJOUT AU PANIER */}
          <button
            onClick={handleAddToCart}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90"
          >
            <ShoppingCart size={20} />
            Ajouter au panier ({basePrice + (isCustomColor ? 2000 : 0)} FCFA)
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIRecoloringModule;
