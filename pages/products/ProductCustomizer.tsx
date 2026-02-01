import React, {useRef, useState, useEffect } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import SidebarLeft from '../../src/components/customer/SidebarLeft';
import Canvas, { CanvasHandle } from '../../src/components/customer/Canvas';
import ToolsPanel from '../../src/components/customer/ToolsPanel';
import { Product, DesignElement, ProductVariant, Category } from '../../types';
import { ShoppingCart, X, Layers, Shirt, Palette, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ Import useLocation
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

const DESIGN_PRICE = 2000; 

// 🎨 MAP COULEURS (Pour retrouver les Hex manquants)
const TEXTILE_COLORS_MAP: Record<string, string> = {
  "Blanc": "#FFFFFF", "Noir": "#000000", "Gris Chiné": "#9CA3AF", "Gris Anthracite": "#374151",
  "Bleu Marine": "#172554", "Bleu Roi": "#2563EB", "Bleu Ciel": "#93C5FD", "Rouge": "#DC2626",
  "Bordeaux": "#7F1D1D", "Vert Forêt": "#14532D", "Vert Pomme": "#22C55E", "Jaune": "#EAB308",
  "Orange": "#EA580C", "Rose": "#EC4899", "Violet": "#7C3AED", "Marron": "#451a03"
};

// Interfaces locales pour s'assurer que TypeScript est content
interface ExtendedProductVariant extends Omit<ProductVariant, 'hex' | 'id'> {
    id: number | string; // ✅ On autorise string (pour 'main') et number
    colorCode?: string; 
    hex?: string; 
    images: string[]; // ✅ On déclare explicitement que c'est un tableau de chaînes
    colorName: string; // On s'assure que c'est là aussi
    stock_quantity?: number;
}

const ProductCustomizer = ({ onAddToCart }: { onAddToCart: (item: any) => void }) => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Hook pour récupérer les données passées
  
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

  // --- CHARGEMENT INITIAL ---
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

        // ✅ LOGIQUE DE RÉCEPTION DES DONNÉES (Détails -> Customizer)
        const state = location.state as { productId?: number; variantId?: number | string; colorName?: string } | null;
        
        let productToSelect = productsData.length > 0 ? productsData[0] : null;

        // 1. Trouver le produit demandé
        if (state?.productId) {
            const found = productsData.find((p: Product) => p.id === Number(state.productId));
            if (found) productToSelect = found;
        }

        // 2. Sélectionner le produit et sa variante
        if (productToSelect) {
            handleSelectProduct(productToSelect, state?.variantId, state?.colorName);
        }

      } catch (error) {
        console.error("Erreur API:", error);
      }
    };
    fetchData();
  }, []);

  // --- SÉLECTION PRODUIT (AMÉLIORÉE POUR FUSIONNER MAIN + VARIANTES) ---
  const handleSelectProduct = (product: Product, targetVariantId?: number | string | null, targetColorName?: string) => {
    setSelectedProduct(product);
    
    // CONSTRUCTION DE LA LISTE DES VARIANTES (Main + DB)
    // C'est la même logique que ProductDetails pour être cohérent
    const mergedVariants: ExtendedProductVariant[] = [];
    const seenColors = new Set<string>();

    // A. Variante Principale
    if (product.image_url) {
        const mainColor = product.color || "Standard";
        mergedVariants.push({
            id: 'main',
            colorName: mainColor,
            hex: TEXTILE_COLORS_MAP[mainColor] || '#FFFFFF',
            colorCode: TEXTILE_COLORS_MAP[mainColor] || '#FFFFFF',
            images: [product.image_url],
            stock_quantity: 100 // Ou product.stock_quantity
        });
        seenColors.add(mainColor.toLowerCase());
    }

    // B. Variantes BDD
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

    // DÉTECTION DE LA VARIANTE À SÉLECTIONNER
    let variantToSelect = mergedVariants[0];

    // Si on a un ID cible
    if (targetVariantId) {
        const found = mergedVariants.find(v => v.id == targetVariantId); // '==' pour matcher string/number
        if (found) variantToSelect = found;
    }
    // Sinon si on a un nom de couleur cible
    else if (targetColorName) {
        const found = mergedVariants.find(v => v.colorName.toLowerCase() === targetColorName.toLowerCase());
        if (found) variantToSelect = found;
    }

    setSelectedVariant(variantToSelect);
    setSelectedSize(""); 
    setMobileView('canvas');
  };

  const handleAddToCartAction = async () => {
    if (!selectedProduct) return;
    if (!selectedSize) { alert("⚠️ Veuillez sélectionner une taille avant d'ajouter au panier."); return; }
    if (!selectedVariant) { alert("⚠️ Veuillez sélectionner une couleur."); return; }

    setIsUploading(true);
    try {
        const designCost = designElements.length * DESIGN_PRICE;
        const productPrice = parseFloat(selectedProduct.price.toString());
        const finalPrice = productPrice + designCost;

        const cartItem = {
            id: `custom-${Date.now()}`,
            product_id: selectedProduct.id, 
            productId: selectedProduct.id, 
            variantId: selectedVariant.id !== 'main' ? selectedVariant.id : null,
            design: designElements, // Envoi direct des éléments (ou process blob si besoin)
            finalPrice: finalPrice,
            image: selectedVariant.images && selectedVariant.images.length > 0 
                   ? selectedVariant.images[0] 
                   : selectedProduct.image_url,
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
            });
            navigate('/boutique'); 
        }
    } catch (error) {
        console.error("Erreur", error);
        alert("Erreur lors de la sauvegarde.");
    } finally {
        setIsUploading(false);
    }
  };

  // --- ACTIONS DESIGN (Inchangé) ---
  const handleAddText = (text: string, font: string) => {
    const newEl: DesignElement = { id: `txt-${Date.now()}`, type: 'text', content: text, x: 150, y: 150, width: 200, height: 50, rotation: 0, fontSize: 30, fontFamily: font, color: '#000000' };
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
  const handleAIGenerate = async (prompt: string) => { /* Logique IA inchangée */ return null; };

  // --- PRÉPARATION ---
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

  if (!selectedProduct) return <div className="h-screen flex items-center justify-center flex-col gap-2"><Loader2 className="animate-spin text-red-600" size={32} /><span className="text-slate-500 font-bold">Chargement...</span></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shadow-sm z-20 shrink-0 h-16">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} className="text-slate-600"/></button>
             <div className="flex flex-col">
                 <span className="font-bold text-slate-800 text-sm line-clamp-1">{selectedProduct.name}</span>
                 <span className="text-xs font-black text-red-600">{currentTotalPrice} FCFA</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="relative">
                  <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className={`appearance-none pl-3 pr-8 py-2 rounded-lg border-2 text-xs font-bold uppercase focus:outline-none cursor-pointer ${!selectedSize ? 'border-red-300 text-red-500 bg-red-50' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                      <option value="" disabled>Taille</option>
                      {(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL']).map(size => (<option key={size} value={size}>{size}</option>))}
                  </select>
              </div>
              <button onClick={handleAddToCartAction} disabled={isUploading} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform text-xs sm:text-sm disabled:opacity-70">
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <ShoppingCart size={16} />} 
                <span className="hidden sm:inline">Ajouter</span>
              </button>
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR GAUCHE */}
        <aside className={`fixed md:relative inset-y-0 left-0 z-30 w-80 bg-white border-r border-slate-200 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'products' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} top-16 md:top-0 h-[calc(100%-4rem)] md:h-full`}>
            <div className="h-full overflow-y-auto">
                <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Shirt size={20}/> Produits</h3>
                    <button onClick={() => setMobileView('canvas')}><X size={24} className="text-slate-400"/></button>
                </div>
                <SidebarLeft products={products} categories={categories} onSelectProduct={(p) => handleSelectProduct(p)} selectedProductId={selectedProduct.id} />
            </div>
        </aside>

        {/* CANVAS */}
        <main className="flex-1 flex flex-col relative bg-slate-100 overflow-hidden touch-none items-center justify-center p-4">
            <div className="relative shadow-xl rounded-xl overflow-hidden bg-white w-full max-w-[500px] aspect-square">
                <Canvas ref={canvasRef} product={selectedProduct} color={currentCanvasColor} elements={designElements} activeElementId={activeElementId} onSelectElement={(id) => { setActiveElementId(id); if (id) setMobileView('tools'); }} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} />
                <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply" style={{ backgroundColor: currentCanvasColor.hex, opacity: 0.1 }}></div>
                <img src={getBgImage()} className="absolute inset-0 w-full h-full object-contain pointer-events-none -z-10 opacity-0" alt=""/>
            </div>
            {(mobileView === 'products' || mobileView === 'tools') && <div className="md:hidden absolute inset-0 bg-black/50 z-20 backdrop-blur-sm" onClick={() => setMobileView('canvas')} />}
        </main>

        {/* TOOLS */}
        <aside className={`fixed md:relative inset-y-0 right-0 z-30 w-full md:w-80 bg-white border-l border-slate-200 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'tools' ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} h-[50vh] md:h-full bottom-0 top-auto md:top-0 rounded-t-3xl md:rounded-none`}>
             <div className="h-full flex flex-col">
                <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Palette size={20}/> Outils</h3>
                    <button onClick={() => setMobileView('canvas')}><X size={24} className="text-slate-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ToolsPanel onAddText={handleAddText} onAddImage={handleAddImage} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} onAIGenerate={handleAIGenerate} activeElement={designElements.find(el => el.id === activeElementId) || null} colors={toolsColors} selectedColor={currentCanvasColor} onSelectColor={(colorObj) => { const variant = availableColors.find(v => (v.hex || v.colorCode) === colorObj.hex); if (variant) setSelectedVariant(variant); }} />
                </div>
             </div>
        </aside>
      </div>

      {/* MOBILE MENU */}
      <div className="md:hidden bg-white border-t border-slate-200 pb-safe z-30 relative">
          <div className="flex justify-around items-center h-16">
              <button onClick={() => setMobileView('products')} className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'products' ? 'text-red-600' : 'text-slate-400'}`}><Shirt size={20} /><span className="text-[10px] font-bold uppercase">Produits</span></button>
              <button onClick={() => setMobileView('canvas')} className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'canvas' ? 'text-red-600' : 'text-slate-400'}`}><Layers size={20} /><span className="text-[10px] font-bold uppercase">Aperçu</span></button>
              <button onClick={() => setMobileView('tools')} className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'tools' ? 'text-red-600' : 'text-slate-400'}`}><Palette size={20} /><span className="text-[10px] font-bold uppercase">Outils</span></button>
          </div>
      </div>
    </div>
  );
};

export default ProductCustomizer;