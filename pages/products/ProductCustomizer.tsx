import { useRef, useState, useEffect } from 'react';
import { authFetch, uploadDesignToServer } from '../../src/utils/apiClient';
import { useToast } from '../../src/utils/context/ToastContext';
import SidebarLeft from '../../src/components/customer/SidebarLeft';
import Canvas, { CanvasHandle } from '../../src/components/customer/Canvas';
import ToolsPanel, { ToolTabType } from '../../src/components/customer/ToolsPanel';
import { Product, DesignElement, ProductVariant, Category } from '../../types';
import { ShoppingCart, X, Layers, Shirt, Palette, ArrowLeft, Loader2, CheckCircle2, Type, Image as ImageIcon, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { BASE_IMG_URL } from '@/components/images/VoirImage';
import WorkshopSkeleton from '../../src/components/tools/WorkshopSkeleton';

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

  // Vue Mobile / Tablette : 'canvas' (vêtement seul) | 'products' (tiroir produits) | 'tools' (tiroir outils)
  const [mobileView, setMobileView] = useState<'canvas' | 'products' | 'tools'>('canvas');
  const [activeToolTab, setActiveToolTab] = useState<ToolTabType>('text');
  const [hideBaseDesign, setHideBaseDesign] = useState(false);

  // État Mode Édition
  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | number | null>(null);
  const [editOrderItemId, setEditOrderItemId] = useState<string | number | null>(null);
  const [editRejectionReason, setEditRejectionReason] = useState<string | null>(null);

  // Clavier virtuel mobile
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Écouteur pour la touche Échap pour fermer les tiroirs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileView !== 'canvas') {
        setMobileView('canvas');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileView]);

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
            orderId?: number | string;
            orderItemId?: number | string;
            rejectionReason?: string;
            existingDesign?: any;
        } | null;
        
        let productToSelect = null;
        const fromProduct = !!(state?.productId || state?.isEdit);

        if (state?.productId) {
            const found = productsData.find((p: Product) => p.id === Number(state.productId));
            if (found) productToSelect = found;
        } else if (!fromProduct) {
            productToSelect = productsData.length > 0 ? productsData[0] : null;
        }

        if (productToSelect) {
            handleSelectProduct(productToSelect, state?.variantId, state?.colorName, state?.sizeName);
        }

        // 🪄 CHARGEMENT DESIGN EXISTANT (MODE ÉDITION)
        if (state?.isEdit && state.existingDesign) {
            setIsEditMode(true);
            if (state.orderId) setEditOrderId(state.orderId);
            if (state.orderItemId) setEditOrderItemId(state.orderItemId);
            if (state.rejectionReason) setEditRejectionReason(state.rejectionReason);

            let rawDesign = state.existingDesign;
            if (typeof rawDesign === 'string') {
                try { rawDesign = JSON.parse(rawDesign); } catch (e) {
                  console.error("Erreur parsing design", e);
                }
            }
            const elems = rawDesign?.elements || rawDesign?.design || (Array.isArray(rawDesign) ? rawDesign : []);
            if (Array.isArray(elems)) setDesignElements(elems);
            if (rawDesign?.options?.size) {
                setSelectedSize(rawDesign.options.size);
            }
            if (rawDesign?.hideBaseDesign !== undefined) {
                setHideBaseDesign(rawDesign.hideBaseDesign);
            }

            // 🎯 Accès complet immédiat aux outils de personnalisation (Texte, Images, Couleurs, Calques, IA)
            setActiveToolTab('text');
            setMobileView('tools');
        }

      } catch (error) {
        console.error("Erreur API Customizer:", error);
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
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
    const defaultSize = targetSizeName || (sizes.includes('M') ? 'M' : sizes[0]);
    setSelectedSize(defaultSize);
  };

  const handleAddToCartAction = async () => {
    if (!selectedProduct) return;
    if (!selectedSize) { showToast("⚠️ Veuillez sélectionner une taille avant de continuer.", "warning"); return; }
    if (!selectedVariant) { showToast("⚠️ Veuillez sélectionner une couleur.", "warning"); return; }

    setIsUploading(true);

    try {
        let designUrl = null;

        if (canvasRef.current) {
            const blob = await canvasRef.current.exportAsImage();
            
            if (blob) {
                const file = new File([blob], `design_${Date.now()}.png`, { type: "image/png" });
                try {
                    designUrl = await uploadDesignToServer(file);
                } catch (err) {
                    console.error("Erreur upload serveur:", err);
                    showToast("Impossible de sauvegarder le design sur le serveur.", "error");
                    setIsUploading(false);
                    return; 
                }
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

        if (isEditMode && editOrderItemId) {
            // ✅ MODE ÉDITION : Mise à jour de l'article existant
            const response = await authFetch(`/api/orders/items/${editOrderItemId}/design`, {
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
                navigate(-1);
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

            showToast("✅ Article personnalisé ajouté au panier !", "success");
            navigate('/boutique');
        }

    } catch (error) {
        console.error("Erreur générale Customizer:", error);
        showToast("Une erreur est survenue lors de l'enregistrement.", "error");
    } finally {
        setIsUploading(false);
    }
  };

  const handleAddText = (text: string, font: string) => {
    const shirtHex = selectedVariant?.hex || selectedVariant?.colorCode || '#FFFFFF';
    const r = parseInt(shirtHex.slice(1, 3), 16) || 0;
    const g = parseInt(shirtHex.slice(3, 5), 16) || 0;
    const b = parseInt(shirtHex.slice(5, 7), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const defaultColor = luminance < 0.5 ? '#FFFFFF' : '#000000';
    const newEl: DesignElement = { 
      id: `txt-${Date.now()}`, 
      type: 'text', 
      content: text, 
      x: 150, 
      y: 150, 
      width: 200, 
      height: 50, 
      rotation: 0, 
      fontSize: 30, 
      fontFamily: font, 
      color: defaultColor 
    };
    setDesignElements([...designElements, newEl]);
    setActiveElementId(newEl.id);
    if (window.innerWidth < 1024) {
      setMobileView('canvas');
    }
  };

  const handleAddImage = (url: string) => {
    const newEl: DesignElement = { 
      id: `img-${Date.now()}`, 
      type: 'image', 
      content: url, 
      x: 150, 
      y: 150, 
      width: 150, 
      height: 150, 
      rotation: 0 
    };
    setDesignElements([...designElements, newEl]);
    setActiveElementId(newEl.id);
    if (window.innerWidth < 1024) {
      setMobileView('canvas');
    }
  };

  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => {
    setDesignElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleDeleteElement = (id: string) => {
    setDesignElements(prev => prev.filter(el => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };
  
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
          console.error("Erreur IA generate:", error);
          showToast("Erreur de connexion.", "error");
          return null;
      }
  };

  const basePrice = selectedProduct ? parseFloat(selectedProduct.price.toString()) : 0;
  const toolsColors = availableColors.map(v => ({ name: v.colorName, hex: v.hex || v.colorCode || '#FFFFFF' }));
  const currentCanvasColor = selectedVariant ? { name: selectedVariant.colorName, hex: selectedVariant.hex || selectedVariant.colorCode || '#FFFFFF' } : { name: 'Défaut', hex: '#FFFFFF' };

  const getBgImage = () => {
      if(selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
          const img = selectedVariant.images[0];
          if (!img) return '';
          if (img.startsWith('http') || img.startsWith('data:')) return img;
          if (img.startsWith('h-designer/')) return `https://res.cloudinary.com/dwyx9e7zw/image/upload/f_auto,q_auto,w_800,c_limit/${img}`;
          return BASE_IMG_URL + img;
      }
      return '';
  };

  useEffect(() => {
    const overlay = document.getElementById('product-color-overlay');
    if (overlay && currentCanvasColor.hex) {
      overlay.style.backgroundColor = currentCanvasColor.hex;
    }
  }, [currentCanvasColor.hex]);

  // Focus clavier mobile
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardOpen(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardOpen(false);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const openToolTab = (tab: ToolTabType) => {
    setActiveToolTab(tab);
    setMobileView('tools');
  };

  if (!selectedProduct) return <WorkshopSkeleton />;

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100vh-64px)] bg-slate-50 overflow-hidden relative transition-colors">
      
      {/* ⚠️ BANDEAU MODE ÉDITION DE COMMANDE CLIENT */}
      {isEditMode && (
        <div className="bg-amber-500 text-white px-4 py-2 shrink-0 flex items-center justify-between shadow-md z-30 transition-all text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-white/20 rounded-lg">
              <AlertCircle size={16} />
            </span>
            <span className="font-bold">
              Mode Édition : Commande #{editOrderId || ''}
            </span>
            <span className="hidden sm:inline bg-black/20 px-2 py-0.5 rounded-full text-xs font-semibold">
              Action Requise / Refusé
            </span>
          </div>
          {editRejectionReason && (
            <div className="hidden md:flex items-center gap-1.5 italic text-amber-100 text-xs">
              <span>Motif : "{editRejectionReason}"</span>
            </div>
          )}
          <span className="text-[11px] bg-white text-amber-900 font-bold px-2 py-0.5 rounded-md">
            Tous les outils actifs
          </span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className={`bg-white border-b border-slate-200 p-3 justify-between items-center shadow-sm z-20 shrink-0 h-16 transition-all duration-300 ${isKeyboardOpen ? '-translate-y-full hidden' : 'translate-y-0 flex'}`}>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => navigate(-1)} 
                title="Retour" 
                style={{ touchAction: 'manipulation' }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
             >
                <ArrowLeft size={20} className="text-slate-600"/>
             </button>
             <div className="flex flex-col">
                 <span className="font-bold text-slate-800 text-sm line-clamp-1">{selectedProduct.name}</span>
                  <span className="text-xs font-black text-theme-primary">
                    {basePrice.toLocaleString()} FCFA
                    {designElements.length > 0 && (
                      <span className="font-normal text-slate-500 ml-1">
                        {`+ Forfait Design ${DESIGN_PRICE.toLocaleString()} FCFA`}
                      </span>
                    )}
                  </span>
             </div>
          </div>

          <div className="flex items-center gap-3">
              <div className="relative">
                   <select 
                    value={selectedSize} 
                    onChange={(e) => setSelectedSize(e.target.value)} 
                    title="Sélectionner la taille"
                    style={{ touchAction: 'manipulation' }}
                    className={`appearance-none pl-3 pr-8 py-2 rounded-lg border-2 text-xs font-bold uppercase focus:outline-none cursor-pointer transition-all ${!selectedSize ? 'border-theme-primary/40 bg-theme-primary/5 text-theme-primary' : 'border-slate-200 text-slate-700 bg-slate-50'}`}
                  >
                      <option value="" disabled>Taille</option>
                      {(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL', '3XL']).map(size => (<option key={size} value={size}>{size}</option>))}
                  </select>
              </div>

              {/* Bouton d'action principal (Enregistrer / Ajouter) */}
              <button 
                onClick={handleAddToCartAction} 
                disabled={isUploading} 
                style={{ touchAction: 'manipulation', backgroundColor: isEditMode ? '#16A34A' : 'var(--theme-primary)' }}
                title={isEditMode ? "Valider le design modifié" : "Ajouter au panier"}
                className="text-white px-4 py-2 rounded-xl font-bold shadow-md flex items-center gap-2 active:scale-95 transition-all text-xs sm:text-sm disabled:opacity-70 cursor-pointer"
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : (isEditMode ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />)} 
                <span className="hidden sm:inline">
                   {isEditMode ? "Valider la modification" : "Ajouter"}
                </span>
              </button>
          </div>
      </div>

      {/* ZONE CENTRALE : CANVAS ET TIROIRS RESPONSIVES */}
      <div className="flex flex-1 overflow-hidden relative z-10 min-h-0">
        
        {/* SIDEBAR PRODUITS - DRAWER FLUIDE SUR MOBILE/TABLETTE */}
        <aside className={`fixed lg:relative inset-x-0 bottom-0 lg:inset-y-0 lg:left-0 z-40 w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-r border-slate-200 rounded-t-3xl lg:rounded-none shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'products' ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:-translate-x-full lg:translate-x-0'} max-h-[85vh] lg:max-h-full flex flex-col h-full`}>
            <div className="lg:hidden py-2 flex justify-center shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-slate-300" />
            </div>
            <div className="h-full flex flex-col">
                <div className="lg:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Shirt size={18}/> Sélection du Produit</h3>
                    <button 
                      onClick={() => setMobileView('canvas')} 
                      style={{ touchAction: 'manipulation' }}
                      title="Fermer" 
                      aria-label="Fermer le menu produits"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer relative z-50 touch-target-44 active:scale-95"
                    >
                      <X size={22} className="pointer-events-none"/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <SidebarLeft 
                      products={products} 
                      categories={categories} 
                      onSelectProduct={(p) => {
                        handleSelectProduct(p);
                        if (window.innerWidth < 1024) setMobileView('canvas');
                      }} 
                      selectedProductId={selectedProduct.id} 
                    />
                </div>
            </div>
        </aside>

        {/* CANVAS DU PRODUIT */}
        <main className="flex-1 flex flex-col relative bg-slate-100 items-center justify-center p-3 lg:p-6 transition-colors min-h-0 overflow-hidden">
            <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-white w-full max-w-[500px] transition-all duration-500 ease-in-out aspect-square max-h-full border border-slate-200">
                <Canvas 
                  ref={canvasRef} 
                  product={selectedProduct} 
                  bgImage={getBgImage()} 
                  hideBaseImage={hideBaseDesign} 
                  color={currentCanvasColor} 
                  elements={designElements} 
                  activeElementId={activeElementId} 
                  onSelectElement={(id) => setActiveElementId(id)} 
                  onUpdateElement={handleUpdateElement} 
                  onDeleteElement={handleDeleteElement} 
                />
                 <div 
                    id="product-color-overlay"
                    className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-10" 
                 ></div>
            </div>

            {/* Backdrop sur mobile/tablette lors de l'ouverture d'un tiroir */}
            {(mobileView === 'products' || mobileView === 'tools') && (
              <div 
                className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-xs transition-opacity cursor-pointer" 
                onClick={() => setMobileView('canvas')} 
              />
            )}
        </main>

        {/* SIDEBAR OUTILS - DRAWER FLUIDE SUR MOBILE/TABLETTE */}
        <aside className={`fixed lg:relative inset-x-0 bottom-0 lg:inset-y-0 lg:right-0 z-40 w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 rounded-t-3xl lg:rounded-none shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${mobileView === 'tools' ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full lg:translate-x-0'} max-h-[85vh] lg:max-h-full flex flex-col h-full`}>
             <div className="lg:hidden py-2 flex justify-center shrink-0">
               <div className="w-12 h-1.5 rounded-full bg-slate-300" />
             </div>
             <div className="lg:hidden px-4 pb-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 text-slate-800 shrink-0">
                 <h3 className="font-bold flex items-center gap-2 text-sm">
                   <Palette size={18} className="text-theme-primary"/> Outils de Personnalisation
                 </h3>
                  <button 
                    onClick={() => setMobileView('canvas')} 
                    style={{ touchAction: 'manipulation' }}
                    title="Fermer" 
                    aria-label="Fermer les paramètres du design"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer relative z-50 touch-target-44 active:scale-95"
                  >
                    <X size={22} className="pointer-events-none"/>
                  </button>
             </div>
             <div className="flex-1 overflow-hidden">
                 <ToolsPanel 
                   onAddText={handleAddText} 
                   hideBaseDesign={hideBaseDesign} 
                   setHideBaseDesign={setHideBaseDesign} 
                   onAddImage={handleAddImage} 
                   onUpdateElement={handleUpdateElement} 
                   onDeleteElement={handleDeleteElement} 
                   onAIGenerate={handleAIGenerate} 
                   activeElement={designElements.find(el => el.id === activeElementId) || null} 
                   colors={toolsColors} 
                   selectedColor={currentCanvasColor} 
                   onSelectColor={(colorObj) => { 
                     const variant = availableColors.find(v => (v.hex || v.colorCode) === colorObj.hex); 
                     if (variant) setSelectedVariant(variant); 
                   }}
                   elements={designElements}
                   onSelectElement={(id) => setActiveElementId(id)}
                   onReorderElements={(newElements) => setDesignElements(newElements)}
                   currentTab={activeToolTab}
                   onTabChange={(tab) => setActiveToolTab(tab)}
                 />
             </div>
        </aside>
      </div>

      {/* 🚀 DOCK INTERACTIF FLOTTANT SUR MOBILE ET TABLETTE (< 1024px) */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe z-30 shrink-0 relative transition-all shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-2 py-2 overflow-x-auto no-scrollbar">
              
              {/* 1. Produit */}
              <button 
                 onClick={() => setMobileView('products')} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${mobileView === 'products' ? 'bg-slate-100 text-theme-primary font-bold scale-105' : 'text-slate-500 hover:text-slate-800 active:scale-95'}`}
                 title="Changer d'article"
              >
                <Shirt size={20} />
                <span className="text-[10px] tracking-tight">Produit</span>
              </button>

              {/* 2. Couleur */}
              <button 
                 onClick={() => openToolTab('product')} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${mobileView === 'tools' && activeToolTab === 'product' ? 'bg-slate-100 text-theme-primary font-bold scale-105' : 'text-slate-500 hover:text-slate-800 active:scale-95'}`}
                 title="Changer la couleur"
              >
                <div 
                  className="w-5 h-5 rounded-full border border-slate-300 shadow-xs" 
                  style={{ backgroundColor: currentCanvasColor.hex }}
                />
                <span className="text-[10px] tracking-tight">Couleur</span>
              </button>

              {/* 3. Texte */}
              <button 
                 onClick={() => openToolTab('text')} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${mobileView === 'tools' && activeToolTab === 'text' ? 'bg-slate-100 text-theme-primary font-bold scale-105' : 'text-slate-500 hover:text-slate-800 active:scale-95'}`}
                 title="Ajouter ou éditer du texte"
              >
                <Type size={20} />
                <span className="text-[10px] tracking-tight">Texte</span>
              </button>

              {/* 4. Images */}
              <button 
                 onClick={() => openToolTab('image')} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${mobileView === 'tools' && activeToolTab === 'image' ? 'bg-slate-100 text-theme-primary font-bold scale-105' : 'text-slate-500 hover:text-slate-800 active:scale-95'}`}
                 title="Importer des images"
              >
                <ImageIcon size={20} />
                <span className="text-[10px] tracking-tight">Images</span>
              </button>

              {/* 5. IA Magic */}
              <button 
                 onClick={() => openToolTab('ai')} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${mobileView === 'tools' && activeToolTab === 'ai' ? 'bg-slate-100 text-theme-primary font-bold scale-105' : 'text-slate-500 hover:text-slate-800 active:scale-95'}`}
                 title="Générateur de design IA"
              >
                <Sparkles size={20} className="text-amber-500" />
                <span className="text-[10px] tracking-tight">IA Magic</span>
              </button>

              {/* 6. Calques (avec compteur) */}
              <button 
                 onClick={() => openToolTab('layers')} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] relative ${mobileView === 'tools' && activeToolTab === 'layers' ? 'bg-slate-100 text-theme-primary font-bold scale-105' : 'text-slate-500 hover:text-slate-800 active:scale-95'}`}
                 title="Gérer les calques"
              >
                <Layers size={20} />
                {designElements.length > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-theme-primary text-white text-[9px] font-bold flex items-center justify-center">
                    {designElements.length}
                  </span>
                )}
                <span className="text-[10px] tracking-tight">Calques</span>
              </button>

              {/* 7. Toggle Motif */}
              <button 
                 onClick={() => setHideBaseDesign(prev => !prev)} 
                 style={{ touchAction: 'manipulation' }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${hideBaseDesign ? 'text-amber-600 bg-amber-50 font-bold' : 'text-slate-400 hover:text-slate-600 active:scale-95'}`}
                 title={hideBaseDesign ? "Motif masqué (T-shirt vierge)" : "Motif d'origine visible"}
              >
                {hideBaseDesign ? <EyeOff size={20} /> : <Eye size={20} />}
                <span className="text-[10px] tracking-tight">{hideBaseDesign ? 'Vierge' : 'Motif'}</span>
              </button>

          </div>
      </div>
    </div>
  );
};

export default ProductCustomizer;