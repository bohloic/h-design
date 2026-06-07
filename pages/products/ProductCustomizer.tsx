import React, {useRef, useState, useEffect, useCallback } from 'react';
import { authFetch, uploadDesignToServer } from '../../src/utils/apiClient';
import { useToast } from '../../src/utils/context/ToastContext';
import SidebarLeft from '../../src/components/customer/SidebarLeft';
import Canvas, { CanvasHandle } from '../../src/components/customer/Canvas';
import ToolsPanel from '../../src/components/customer/ToolsPanel';
import { Product, DesignElement, ProductVariant, Category } from '../../types';
import { ShoppingCart, X, Layers, Shirt, Palette, ArrowLeft, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

const DESIGN_PRICE = 5000; // Forfait unique de personnalisation 5000 FCFA
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
  const { showToast } = useToast();
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

  const [mobileView, setMobileView] = useState<'products' | 'canvas' | 'tools'>('products');
  const [currentStep, setCurrentStep] = useState(1); // 1: Product, 2: Design, 3: Review
  const [hideBaseDesign, setHideBaseDesign] = useState(false);

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

        const state = location.state as { 
            productId?: number; 
            variantId?: number | string; 
            colorName?: string;
            sizeName?: string;
            isEdit?: boolean;
            existingDesign?: any;
        } | null;
        
        let productToSelect = null;

        if (state?.productId) {
            const found = productsData.find((p: Product) => p.id === Number(state.productId));
            if (found) productToSelect = found;
        } else {
            // 🎯 RECHERCHE DU T-SHIRT BLANC PAR DÉFAUT
            productToSelect = productsData.find((p: Product) => 
                p.name.toLowerCase().includes('t-shirt') && 
                (p.name.toLowerCase().includes('blanc') || p.name.toLowerCase().includes('vierge'))
            );
            
            // Si pas trouvé, on cherche n'importe quel T-shirt
            if (!productToSelect) {
                productToSelect = productsData.find((p: Product) => p.name.toLowerCase().includes('t-shirt'));
            }

            // Sinon le premier
            if (!productToSelect) {
                productToSelect = productsData.length > 0 ? productsData[0] : null;
            }
        }

        if (productToSelect) {
            handleSelectProduct(productToSelect, state?.variantId, state?.colorName, state?.sizeName);
        }

        // 🪄 CHARGEMENT DESIGN EXISTANT (MODE ÉDITION)
        if (state?.isEdit && state.existingDesign) {
            console.log("🛠️ Mode Édition activé, chargement du design...");
            if (state.existingDesign.elements) {
                setDesignElements(state.existingDesign.elements);
            }
            if (state.existingDesign.options?.size) {
                setSelectedSize(state.existingDesign.options.size);
            }
            if (state.existingDesign.hideBaseDesign !== undefined) {
                setHideBaseDesign(state.existingDesign.hideBaseDesign);
            }
            // On saute directement au canvas pour l'édition
            setCurrentStep(2);
            setMobileView('canvas');
        }

      } catch (error) {
        console.error("Erreur API:", error);
      }
    };
    fetchData();
  }, []);

  const handleSelectProduct = (product: Product, targetVariantId?: number | string | null, targetColorName?: string, targetSizeName?: string) => {
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

    // AJOUT DES COULEURS STANDARDS RESTANTES
    Object.keys(TEXTILE_COLORS_MAP).forEach(key => {
        if (!seenColors.has(key.toLowerCase())) {
            mergedVariants.push({
                id: `std-${key}`,
                colorName: key,
                hex: TEXTILE_COLORS_MAP[key],
                colorCode: TEXTILE_COLORS_MAP[key],
                images: product.image_url ? [product.image_url] : [],
                stock_quantity: 100
            });
            seenColors.add(key.toLowerCase());
        }
    });

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
    // 🎯 Taille M ou taille précédente
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
    const defaultSize = targetSizeName || (sizes.includes('M') ? 'M' : sizes[0]);
    setSelectedSize(defaultSize);
    
    // Sur mobile/tablette, on passe automatiquement à l'étape suivante après choix produit
    if (window.innerWidth < 1024) {
      setMobileView('canvas');
      setCurrentStep(2);
    }
  };

  const handleAddToCartAction = async () => {
    if (!selectedProduct) return;
    if (!selectedSize) { showToast("⚠️ Veuillez sélectionner une taille avant d'ajouter au panier.", "warning"); return; }
    if (!selectedVariant) { showToast("⚠️ Veuillez sélectionner une couleur.", "warning"); return; }

    setIsUploading(true);

    try {
        let designUrl = null;

        if (canvasRef.current) {
            console.log("📸 Tentative d'exportation du canvas...");
            const blob = await canvasRef.current.exportAsImage();
            
            if (blob) {
                console.log("✅ Canvas exporté (Blob size:", blob.size, ")");
                const file = new File([blob], `design_${Date.now()}.png`, { type: "image/png" });
                
                try {
                    designUrl = await uploadDesignToServer(file);
                    console.log("☁️ Design uploadé avec succès:", designUrl);
                } catch (err) {
                    console.error("❌ Erreur upload serveur:", err);
                    showToast("Impossible de sauvegarder le design sur le serveur.", "error");
                    setIsUploading(false);
                    return; 
                }
            } else {
                console.error("❌ L'exportation du canvas a renvoyé NULL (Problème html2canvas)");
                // Optionnel : ne pas bloquer l'ajout au panier mais prévenir
                // alert("Attention: La photo personnalisée n'a pas pu être générée.");
            }
        }

        const designCost = designElements.length > 0 ? DESIGN_PRICE : 0;
        const productPrice = parseFloat(selectedProduct.price.toString());
        const finalPrice = productPrice + designCost;

        const cartItem = {
            id: `custom-${Date.now()}`,
            product_id: selectedProduct.id, 
            productId: selectedProduct.id, 
            variantId: selectedVariant.id !== 'main' ? selectedVariant.id : null,
            design: {
                elements: designElements,
                customizationImage: designUrl,
                hideBaseDesign: hideBaseDesign
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

        const editState = location.state as { isEdit?: boolean; orderItemId?: number } | null;

        if (editState?.isEdit) {
            // ✅ MODE ÉDITION : On met à jour l'article existant
            const response = await authFetch(`/api/orders/items/${editState.orderItemId}/design`, {
                method: 'PUT',
                body: JSON.stringify({
                    customization: JSON.stringify({
                        elements: designElements,
                        customizationImage: designUrl,
                        hideBaseDesign: hideBaseDesign
                    }),
                    image_url: designUrl,
                    size: selectedSize,
                    color: selectedVariant?.colorName,
                    unit_price: finalPrice
                })
            });

            if (response && response.ok) {
                showToast("✅ Votre design a été mis à jour avec succès !", "success");
                navigate(-1); // Retour aux détails de la commande
            } else {
                throw new Error("Erreur lors de la mise à jour du design");
            }
        } else if (onAddToCart) {
            // ✅ MODE NORMAL : Ajout au panier
            onAddToCart({ 
                ...selectedProduct, 
                ...cartItem, 
                name: `${selectedProduct.name} (Perso)`, 
                price: finalPrice, 
                quantity: 1, 
                image_url: designUrl || selectedProduct.image_url 
            });
            // ✅ NOTIFICATION PERSISTANTE (Correctif Prod)
            const toast = document.createElement('div');
            toast.id = 'cart-success-toast';
            toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 animate-in slide-in-from-bottom-5 duration-300';
            
            toast.innerHTML = `
              <div class="flex items-center gap-3">
                <span class="text-xl">✅</span>
                <span class="font-bold whitespace-nowrap">Article ajouté au panier !</span>
              </div>
              <button class="ml-4 p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors" onclick="this.parentElement.remove()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            `;
            
            // On supprime l'ancien toast s'il existe
            const oldToast = document.getElementById('cart-success-toast');
            if (oldToast) oldToast.remove();
            
            document.body.appendChild(toast);
            
            // On laisse quand même une fermeture automatique très longue (15s) au cas où l'utilisateur oublie
            setTimeout(() => { 
                if (document.body.contains(toast)) {
                    toast.style.opacity = '0'; 
                    toast.style.transition = 'opacity 0.8s'; 
                    setTimeout(() => toast.remove(), 800); 
                }
            }, 15000);
            navigate('/boutique');
        }

    } catch (error) {
        console.error("Erreur générale:", error);
        showToast("Une erreur est survenue lors de l'ajout au panier.", "error");
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
              showToast(data.text || "L'IA n'a pas pu générer l'image.", "error");
              return null;
          }
      } catch (error) {
          console.error("Erreur generate:", error);
          showToast("Erreur de connexion.", "error");
          return null;
      }
  };

  const basePrice = selectedProduct ? parseFloat(selectedProduct.price.toString()) : 0;
  const designCost = designElements.length > 0 ? DESIGN_PRICE : 0;
  const currentTotalPrice = (basePrice + designCost).toFixed(0);

  const toolsColors = availableColors.map(v => ({ name: v.colorName, hex: v.hex || v.colorCode || '#FFFFFF' }));
  const currentCanvasColor = selectedVariant ? { name: selectedVariant.colorName, hex: selectedVariant.hex || selectedVariant.colorCode || '#FFFFFF' } : { name: 'Défaut', hex: '#FFFFFF' };

  const getBgImage = () => {
      if(selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
          const img = selectedVariant.images[0];
          return img.startsWith('http') ? img : BASE_IMG_URL + img;
      }
      return '';
  };

  useEffect(() => {
    const overlay = document.getElementById('product-color-overlay');
    if (overlay && currentCanvasColor.hex) {
      overlay.style.backgroundColor = currentCanvasColor.hex;
    }
  }, [currentCanvasColor.hex]);

  if (!selectedProduct) return <div className="h-screen flex items-center justify-center flex-col gap-2"><Loader2 className="animate-spin text-theme-primary" size={32} /><span className="text-slate-500 font-bold">Chargement...</span></div>;

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100vh-64px)] bg-slate-50 dark:bg-carbon overflow-hidden relative transition-colors">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-carbon border-b border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center shadow-sm z-20 shrink-0 h-16 transition-colors">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} title="Retour" className="p-2 hover-theme-bg rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600 dark:text-slate-300"/></button>
             <div className="flex flex-col">
                 <span className="font-bold text-slate-800 dark:text-pure text-sm line-clamp-1">{selectedProduct.name}</span>
                 {/* 🪄 PRIX TRANSPARENT */}
                  <span className="text-xs font-black text-theme-primary">
                    {basePrice.toLocaleString()} FCFA
                    {designElements.length > 0 && (
                      <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">
                        {`+ Forfait Design ${DESIGN_PRICE.toLocaleString()} FCFA`}
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
                    title="Sélectionner la taille"
                    className={`appearance-none pl-3 pr-8 py-2 rounded-lg border-2 text-xs font-bold uppercase focus:outline-none cursor-pointer transition-all ${!selectedSize ? 'border-theme-primary/40 bg-theme-primary/5 text-theme-primary' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'}`}
                  >
                      <option value="" disabled>Taille</option>
                      {(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL', '3XL']).map(size => (<option key={size} value={size}>{size}</option>))}
                  </select>
              </div>
               <button 
                onClick={handleAddToCartAction} 
                disabled={isUploading} 
                title={location.state?.isEdit ? "Mettre à jour" : "Ajouter au panier"}
                className="text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all text-xs sm:text-sm disabled:opacity-70 bg-theme-primary"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : (location.state?.isEdit ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />)} 
                <span className="hidden sm:inline">
                   {location.state?.isEdit ? "Mettre à jour" : "Ajouter"}
                </span>
              </button>
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10 min-h-0">
        {/* SIDEBAR PRODUITS */}
        <aside className={`absolute lg:relative inset-y-0 left-0 z-30 w-full lg:w-80 bg-white dark:bg-carbon border-r border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'products' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} h-full`}>
            <div className="h-full flex flex-col">
                <div className="lg:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-pure flex items-center gap-2 text-sm"><Shirt size={18}/> Produits</h3>
                    <button onClick={() => setMobileView('canvas')} title="Fermer" className="p-1"><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <SidebarLeft products={products} categories={categories} onSelectProduct={(p) => handleSelectProduct(p)} selectedProductId={selectedProduct.id} />
                </div>
            </div>
        </aside>

        <main className="flex-1 flex flex-col relative bg-slate-100 dark:bg-slate-900/40 items-center justify-center p-3 lg:p-6 transition-colors min-h-0 overflow-hidden">
            <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-800 w-full max-w-[500px] transition-all duration-500 ease-in-out aspect-square max-h-full">
                <Canvas ref={canvasRef} product={selectedProduct} bgImage={getBgImage()} hideBaseImage={hideBaseDesign} color={currentCanvasColor} elements={designElements} activeElementId={activeElementId} onSelectElement={(id) => setActiveElementId(id)} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} />
                 <div 
                    id="product-color-overlay"
                    className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-10" 
                 ></div>
            </div>
            {(mobileView === 'products' || mobileView === 'tools') && <div className="lg:hidden absolute inset-0 bg-black/40 z-20 backdrop-blur-sm transition-opacity" onClick={() => setMobileView('canvas')} />}
        </main>

        <aside className={`absolute lg:relative inset-y-0 right-0 z-30 w-full lg:w-80 bg-white dark:bg-carbon border-l border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'tools' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} h-full flex flex-col`}>
             <div className="lg:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-pure shrink-0">
                 <h3 className="font-bold flex items-center gap-2 text-sm"><Palette size={18}/> Outils</h3>
                  <button onClick={() => setMobileView('canvas')} title="Fermer" className="p-1"><X size={20} className="text-slate-400"/></button>
             </div>
             <div className="flex-1 overflow-hidden">
                 <ToolsPanel onAddText={handleAddText} hideBaseDesign={hideBaseDesign} setHideBaseDesign={setHideBaseDesign} onAddImage={handleAddImage} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} onAIGenerate={handleAIGenerate} activeElement={designElements.find(el => el.id === activeElementId) || null} colors={toolsColors} selectedColor={currentCanvasColor} onSelectColor={(colorObj) => { const variant = availableColors.find(v => (v.hex || v.colorCode) === colorObj.hex); if (variant) setSelectedVariant(variant); }} />
             </div>
        </aside>
      </div>

      {/* MOBILE MENU - 🪄 COMPACT & PREMIUM */}
      <div className="lg:hidden bg-white dark:bg-carbon border-t border-slate-200 dark:border-slate-800 pb-safe z-30 shrink-0 relative transition-all shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
          
          {/* Barre de progression d'étapes amincie */}
          <div className="flex items-center px-8 pt-2 pb-1 gap-2">
            {[1, 2, 3].map((s) => (
               <div 
                key={s} 
                className={`h-1 flex-1 rounded-full transition-all duration-700 ${currentStep >= s ? "bg-theme-primary" : "bg-slate-100 dark:bg-slate-800"}`}
              />
            ))}
          </div>

          <div className="flex justify-around items-center py-1.5 shrink-0">
              <button 
                 onClick={() => { setMobileView('products'); setCurrentStep(1); }} 
                 className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${currentStep === 1 ? 'scale-105 text-theme-primary' : 'text-slate-400 opacity-70'}`}
              >
                <Shirt size={18} className={currentStep === 1 ? "animate-pulse" : ""} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Article</span>
              </button>
              
              <button 
                 onClick={() => { setMobileView('canvas'); setCurrentStep(2); }} 
                 className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${currentStep === 2 ? 'scale-105 text-theme-primary' : 'text-slate-400 opacity-70'}`}
              >
                <Palette size={18} className={currentStep === 2 ? "animate-pulse" : ""} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Design</span>
              </button>
              
              <button 
                 onClick={() => { setMobileView('tools'); setCurrentStep(3); }} 
                 className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${currentStep === 3 ? 'scale-105 text-theme-primary' : 'text-slate-400 opacity-70'}`}
              >
                <Layers size={18} className={currentStep === 3 ? "animate-pulse" : ""} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Revue</span>
              </button>
          </div>

          {/* Bouton d'action principale optimisé */}
          <div className="px-4 pb-2">
            {currentStep === 1 && selectedProduct && (
              <button 
                 onClick={() => { setMobileView('canvas'); setCurrentStep(2); }}
                 className="w-full py-2.5 rounded-xl text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all bg-theme-primary"
              >
                Personnaliser <ArrowRight size={16} />
              </button>
            )}
            {currentStep === 2 && (
              <button 
                 onClick={() => { setMobileView('tools'); setCurrentStep(3); }}
                 className="w-full py-2.5 rounded-xl text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all bg-theme-primary"
              >
                Finitions <ArrowRight size={16} />
              </button>
            )}
             {currentStep === 3 && (
              <button 
                 onClick={handleAddToCartAction}
                 disabled={isUploading}
                 className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
              >
                 {isUploading ? <Loader2 className="animate-spin" size={16}/> : (location.state?.isEdit ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />)}
                 {location.state?.isEdit ? "METTRE À JOUR LE DESIGN" : "AJOUTER AU PANIER"}
              </button>
            )}
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