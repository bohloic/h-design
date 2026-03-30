import React, {useRef, useState, useEffect, useCallback } from 'react';
import { authFetch, uploadDesignToServer } from '../../src/utils/apiClient';
import SidebarLeft from '../../src/components/customer/SidebarLeft';
import Canvas, { CanvasHandle } from '../../src/components/customer/Canvas';
import ToolsPanel from '../../src/components/customer/ToolsPanel';
import { Product, DesignElement, ProductVariant, Category } from '../../types';
import { ShoppingCart, X, Layers, Shirt, Palette, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

const DESIGN_PRICE = 2000; 

const TEXTILE_COLORS_MAP: Record<string, string> = {
  "Blanc": "#FFFFFF", "Noir": "#000000", "Gris Chiné": "#9CA3AF", "Gris Anthracite": "#374151",
  "Bleu Marine": "#172554", "Bleu Roi": "#2563EB", "Bleu Ciel": "#93C5FD", "Rouge": "#DC2626",
  "Bordeaux": "#7F1D1D", "Vert Forêt": "#14532D", "Vert Pomme": "#22C55E", "Jaune": "#EAB308",
  "Orange": "#EA580C", "Rose": "#EC4899", "Violet": "#7C3AED", "Marron": "#451a03"
};

interface ExtendedProductVariant extends Omit<ProductVariant, 'hex' | 'id'> {
    id: number | string; 
    colorCode?: string; 
    hex?: string; 
    images: string[]; 
    colorName: string; 
    stock_quantity?: number;
}

const ProductCustomizer = ({ onAddToCart }: { onAddToCart: (item: any) => void }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [availableColors, setAvailableColors] = useState<ExtendedProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ExtendedProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(""); 

  const [designElements, setDesignElements] = useState<DesignElement[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [mobileView, setMobileView] = useState<'canvas' | 'products' | 'tools'>('canvas');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
            authFetch('/api/products/get-product'),
            authFetch('/api/categories')
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData);
        setCategories(categoriesData);

        const state = location.state as { productId?: number; variantId?: number | string; colorName?: string } | null;
        
        let productToSelect = productsData.length > 0 ? productsData[0] : null;

        if (state?.productId) {
            const found = productsData.find((p: Product) => p.id === Number(state.productId));
            if (found) productToSelect = found;
        }

        if (productToSelect) {
            handleSelectProduct(productToSelect, state?.variantId, state?.colorName);
        }

      } catch (error) {
        console.error("Erreur API:", error);
      }
    };
    fetchData();
  }, []);

  const handleSelectProduct = (product: Product, targetVariantId?: number | string | null, targetColorName?: string) => {
    setSelectedProduct(product);
    
    const mergedVariants: ExtendedProductVariant[] = [];
    const seenColors = new Set<string>();

    if (product.image_url) {
        const mainColor = product.color || "Standard";
        mergedVariants.push({
            id: 'main',
            colorName: mainColor,
            hex: TEXTILE_COLORS_MAP[mainColor] || '#FFFFFF',
            colorCode: TEXTILE_COLORS_MAP[mainColor] || '#FFFFFF',
            images: [product.image_url],
            stock_quantity: 100 
        });
        seenColors.add(mainColor.toLowerCase());
    }

    if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((v: any) => {
            const vName = v.colorName || v.color_name;
            if (vName && !seenColors.has(vName.toLowerCase())) {
                let vImages = [];
                try { vImages = typeof v.images === 'string' ? JSON.parse(v.images) : v.images; } catch(e) { vImages = []; }
                
                mergedVariants.push({
                    ...v,
                    id: v.id,
                    colorName: vName,
                    hex: v.hex || v.colorCode || TEXTILE_COLORS_MAP[vName] || '#000',
                    images: vImages
                });
                seenColors.add(vName.toLowerCase());
            }
        });
    }

    setAvailableColors(mergedVariants);

    let variantToSelect = mergedVariants[0];

    if (targetVariantId) {
        const found = mergedVariants.find(v => v.id == targetVariantId); 
        if (found) variantToSelect = found;
    }
    else if (targetColorName) {
        const found = mergedVariants.find(v => v.colorName.toLowerCase() === targetColorName.toLowerCase());
        if (found) variantToSelect = found;
    }

    setSelectedVariant(variantToSelect);
    // 🎯 Taille M pré-sélectionnée par défaut
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
    const defaultSize = sizes.includes('M') ? 'M' : sizes[0];
    setSelectedSize(defaultSize);
    setMobileView('canvas');
  };

  const handleAddToCartAction = async () => {
    if (!selectedProduct) return;
    if (!selectedSize) { alert("⚠️ Veuillez sélectionner une taille avant d'ajouter au panier."); return; }
    if (!selectedVariant) { alert("⚠️ Veuillez sélectionner une couleur."); return; }

    setIsUploading(true);

    try {
        let designUrl = null;

        if (designElements.length > 0 && canvasRef.current) {
            const blob = await canvasRef.current.exportAsImage();
            
            if (blob) {
                const file = new File([blob], `design_${Date.now()}.png`, { type: "image/png" });
                
                try {
                    designUrl = await uploadDesignToServer(file);
                } catch (err) {
                    console.error("Erreur upload:", err);
                    alert("Impossible de sauvegarder le design. Réessayez.");
                    setIsUploading(false);
                    return; 
                }
            }
        }

        const designCost = designElements.length * DESIGN_PRICE;
        const productPrice = parseFloat(selectedProduct.price.toString());
        const finalPrice = productPrice + designCost;

        const cartItem = {
            id: `custom-${Date.now()}`,
            product_id: selectedProduct.id, 
            productId: selectedProduct.id, 
            variantId: selectedVariant.id !== 'main' ? selectedVariant.id : null,
            design: {
                elements: designElements,
                customizationImage: designUrl
            },
            finalPrice: finalPrice,
            image: designUrl || (selectedVariant.images && selectedVariant.images.length > 0 
                     ? selectedVariant.images[0] 
                     : selectedProduct.image_url),
            options: {
                size: selectedSize,
                color: selectedVariant.colorName,
                variant_info: selectedVariant 
            }
        };

        if(onAddToCart) {
            onAddToCart({ 
                ...selectedProduct, 
                ...cartItem, 
                name: `${selectedProduct.name} (Perso)`, 
                price: finalPrice, 
                quantity: 1, 
                image_url: designUrl || selectedProduct.image_url 
            });
            // Affiche un toast de succès et navigue vers la boutique
            const toast = document.createElement('div');
            toast.textContent = '✅ Article ajouté au panier !';
            toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:12px 24px;border-radius:12px;font-weight:bold;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease';
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 2500);
            navigate('/boutique');
        }

    } catch (error) {
        console.error("Erreur générale:", error);
        alert("Une erreur est survenue lors de l'ajout au panier.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleAddText = (text: string, font: string) => {
    // Détection automatique du contraste : si le t-shirt est sombre → texte blanc par défaut
    const shirtHex = selectedVariant?.hex || selectedVariant?.colorCode || '#FFFFFF';
    const r = parseInt(shirtHex.slice(1, 3), 16) || 0;
    const g = parseInt(shirtHex.slice(3, 5), 16) || 0;
    const b = parseInt(shirtHex.slice(5, 7), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const defaultColor = luminance < 0.5 ? '#FFFFFF' : '#000000';
    const newEl: DesignElement = { id: `txt-${Date.now()}`, type: 'text', content: text, x: 150, y: 150, width: 200, height: 50, rotation: 0, fontSize: 30, fontFamily: font, color: defaultColor };
    setDesignElements([...designElements, newEl]);
    setActiveElementId(newEl.id);
    setMobileView('canvas');
  };
  const handleAddImage = (url: string) => {
    const newEl: DesignElement = { id: `img-${Date.now()}`, type: 'image', content: url, x: 150, y: 150, width: 150, height: 150, rotation: 0 };
    setDesignElements([...designElements, newEl]);
    setActiveElementId(newEl.id);
    setMobileView('canvas');
  };
  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => setDesignElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  const handleDeleteElement = (id: string) => { setDesignElements(prev => prev.filter(el => el.id !== id)); setActiveElementId(null); };
  
  const handleAIGenerate = async (prompt: string) => {
      try {
          const response = await authFetch('/api/ai/generate-design', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: prompt })
          });
          const data = await response.json();
          if (data.success && data.imageUrl) {
              return data.imageUrl;
          } else {
              alert(data.text || "L'IA n'a pas pu générer l'image.");
              return null;
          }
      } catch (error) {
          console.error("Erreur generate:", error);
          alert("Erreur de connexion.");
          return null;
      }
  };

  const basePrice = selectedProduct ? parseFloat(selectedProduct.price.toString()) : 0;
  const currentTotalPrice = (basePrice + (designElements.length * DESIGN_PRICE)).toFixed(0);

  const toolsColors = availableColors.map(v => ({ name: v.colorName, hex: v.hex || v.colorCode || '#FFFFFF' }));
  const currentCanvasColor = selectedVariant ? { name: selectedVariant.colorName, hex: selectedVariant.hex || selectedVariant.colorCode || '#FFFFFF' } : { name: 'Défaut', hex: '#FFFFFF' };

  const getBgImage = () => {
      if(selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
          const img = selectedVariant.images[0];
          return img.startsWith('http') ? img : BASE_IMG_URL + img;
      }
      return '';
  };

  if (!selectedProduct) return <div className="h-screen flex items-center justify-center flex-col gap-2"><Loader2 className="animate-spin" style={{ color: 'var(--theme-primary)' }} size={32} /><span className="text-slate-500 font-bold">Chargement...</span></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-carbon overflow-hidden relative transition-colors">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-carbon border-b border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center shadow-sm z-20 shrink-0 h-16 transition-colors">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 hover-theme-bg rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600 dark:text-slate-300"/></button>
             <div className="flex flex-col">
                 <span className="font-bold text-slate-800 dark:text-pure text-sm line-clamp-1">{selectedProduct.name}</span>
                 {/* 🪄 PRIX TRANSPARENT */}
                 <span className="text-xs font-black" style={{ color: 'var(--theme-primary)' }}>
                   {basePrice.toLocaleString()} FCFA
                   {designElements.length > 0 && (
                     <span className="font-normal text-slate-400 dark:text-slate-500">
                       {` + ${(designElements.length * DESIGN_PRICE).toLocaleString()} FCFA design`}
                     </span>
                   )}
                 </span>
             </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="relative">
                  {/* 🪄 SELECT DYNAMIQUE */}
                  <select 
                    value={selectedSize} 
                    onChange={(e) => setSelectedSize(e.target.value)} 
                    style={!selectedSize ? { borderColor: 'color-mix(in srgb, var(--theme-primary) 40%, transparent)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', color: 'var(--theme-primary)' } : {}}
                    className={`appearance-none pl-3 pr-8 py-2 rounded-lg border-2 text-xs font-bold uppercase focus:outline-none cursor-pointer transition-all ${!selectedSize ? '' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'}`}
                  >
                      <option value="" disabled>Taille</option>
                      {(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL']).map(size => (<option key={size} value={size}>{size}</option>))}
                  </select>
              </div>
              <button 
                onClick={handleAddToCartAction} 
                disabled={isUploading} 
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all text-xs sm:text-sm disabled:opacity-70"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <ShoppingCart size={16} />} 
                <span className="hidden sm:inline">Ajouter</span>
              </button>
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`fixed md:relative inset-y-0 left-0 z-30 w-80 bg-white dark:bg-carbon border-r border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'products' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} top-16 md:top-0 h-[calc(100%-4rem)] md:h-full`}>
            <div className="h-full overflow-y-auto">
                <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-800 dark:text-pure flex items-center gap-2"><Shirt size={20}/> Produits</h3>
                    <button onClick={() => setMobileView('canvas')}><X size={24} className="text-slate-400"/></button>
                </div>
                <SidebarLeft products={products} categories={categories} onSelectProduct={(p) => handleSelectProduct(p)} selectedProductId={selectedProduct.id} />
            </div>
        </aside>

        <main className="flex-1 flex flex-col relative bg-slate-100 dark:bg-slate-900/40 overflow-hidden touch-none items-center justify-center p-4 transition-colors">
            <div className="relative shadow-xl rounded-xl overflow-hidden bg-white dark:bg-slate-800 w-full max-w-[500px] aspect-square transition-colors">
                <Canvas ref={canvasRef} product={selectedProduct} color={currentCanvasColor} elements={designElements} activeElementId={activeElementId} onSelectElement={(id) => { setActiveElementId(id); if (id) setMobileView('tools'); }} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} />
                <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply" style={{ backgroundColor: currentCanvasColor.hex, opacity: 0.1 }}></div>
                <img src={getBgImage()} className="absolute inset-0 w-full h-full object-contain pointer-events-none -z-10 opacity-0" alt=""/>
            </div>
            {(mobileView === 'products' || mobileView === 'tools') && <div className="md:hidden absolute inset-0 bg-black/50 z-20 backdrop-blur-sm" onClick={() => setMobileView('canvas')} />}
        </main>

        <aside className={`fixed md:relative inset-y-0 right-0 z-30 w-full md:w-80 bg-white dark:bg-carbon border-l border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'tools' ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} h-[50vh] md:h-full bottom-0 top-auto md:top-0 rounded-t-3xl md:rounded-none`}>
             <div className="h-full flex flex-col">
                <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl text-slate-800 dark:text-pure">
                    <h3 className="font-bold flex items-center gap-2"><Palette size={20}/> Outils</h3>
                    <button onClick={() => setMobileView('canvas')}><X size={24} className="text-slate-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ToolsPanel onAddText={handleAddText} onAddImage={handleAddImage} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} onAIGenerate={handleAIGenerate} activeElement={designElements.find(el => el.id === activeElementId) || null} colors={toolsColors} selectedColor={currentCanvasColor} onSelectColor={(colorObj) => { const variant = availableColors.find(v => (v.hex || v.colorCode) === colorObj.hex); if (variant) setSelectedVariant(variant); }} />
                </div>
             </div>
        </aside>
      </div>

      {/* MOBILE MENU - 🪄 ONGLETS DYNAMIQUES */}
      <div className="md:hidden bg-white dark:bg-carbon border-t border-slate-200 dark:border-slate-800 pb-safe z-30 relative transition-colors">
          <div className="flex justify-around items-center h-16">
              <button 
                onClick={() => setMobileView('products')} 
                style={mobileView === 'products' ? { color: 'var(--theme-primary)' } : {}}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${mobileView === 'products' ? '' : 'text-slate-400'}`}
              >
                <Shirt size={20} />
                <span className="text-[10px] font-bold uppercase">Produits</span>
              </button>
              
              <button 
                onClick={() => setMobileView('canvas')} 
                style={mobileView === 'canvas' ? { color: 'var(--theme-primary)' } : {}}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${mobileView === 'canvas' ? '' : 'text-slate-400'}`}
              >
                <Layers size={20} />
                <span className="text-[10px] font-bold uppercase">Aperçu</span>
              </button>
              
              <button 
                onClick={() => setMobileView('tools')} 
                style={mobileView === 'tools' ? { color: 'var(--theme-primary)' } : {}}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${mobileView === 'tools' ? '' : 'text-slate-400'}`}
              >
                <Palette size={20} />
                <span className="text-[10px] font-bold uppercase">Outils</span>
              </button>
          </div>
      </div>

      <style>{`
        .hover-theme-bg:hover {
            background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent) !important;
        }
        .hover-theme-bg:hover svg {
            color: var(--theme-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default ProductCustomizer;