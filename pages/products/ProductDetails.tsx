/**
 * ProductDetails.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de détail produit avec CONFIGURATEUR 3D TEMPS RÉEL.
 *
 * Architecture visuelle :
 *   • Si product.model_url est défini → <model-viewer> (Google/Three.js)
 *     monté via DOM ref (useEffect) pour éviter les conflits de types TS
 *     ↳ Changement de couleur via pbrMetallicRoughness.setBaseColorFactor()
 *     ↳ Les ombres et plis "baked" dans le .glb sont préservés
 *     ↳ Fond transparent → superposition d'un background CSS libre
 *   • Sinon → fallback sur l'image 2D classique (aucune régression)
 *
 * Synchronisation panier :
 *   • Un champ caché <input name="selected_color"> est mis à jour à chaque
 *     changement de couleur (HEX libre ou SKU du variant catalogue).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ShoppingCart, Star, Truck,
    Ruler, Loader2, Palette, Share2, Check, AlertCircle, Heart, ArrowLeft,
    Box, Image as ImageIcon
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/constants';
import { authFetch, safeParseJson } from '@/src/utils/apiClient';
import GenderCategorySection from '@/src/components/product/GenderCategorySection';
import ProductCarousel from '@/src/components/product/ProductCarousel';
import SafeImage from '@/src/components/tools/SafeImage';
import { useWishlistStore } from '@/src/store/useWishlistStore';
import { useToast } from '@/src/utils/context/ToastContext';

// ─── Type interne pour l'API model-viewer (Custom Element, pas de @types) ────
// On caste modelViewerRef.current vers ce type pour accéder à l'API JS proprement
interface ModelViewerElement extends HTMLElement {
    model?: {
        materials: Array<{
            name: string;
            pbrMetallicRoughness: {
                setBaseColorFactor: (rgba: [number, number, number, number]) => void;
                baseColorFactor: [number, number, number, number];
            };
        }>;
    };
    src: string;
    alt: string;
    cameraControls: boolean;
    shadowIntensity: number;
    exposure: number;
}

// ─── Palette couleurs textile standard ────────────────────────────────────────
const TEXTILE_COLORS_MAP: Record<string, string> = {
    "Blanc": "#FFFFFF", "Noir": "#000000", "Gris Chiné": "#9CA3AF",
    "Gris Anthracite": "#374151", "Bleu Marine": "#172554", "Bleu Roi": "#2563EB",
    "Bleu Ciel": "#93C5FD", "Rouge": "#DC2626", "Bordeaux": "#7F1D1D",
    "Vert Forêt": "#14532D", "Vert Pomme": "#22C55E", "Jaune": "#EAB308",
    "Orange": "#EA580C", "Rose": "#EC4899", "Violet": "#7C3AED", "Marron": "#451a03"
};

const getColorHex = (name: string): string => {
    if (!name) return '#000000';
    if (TEXTILE_COLORS_MAP[name]) return TEXTILE_COLORS_MAP[name];
    const key = Object.keys(TEXTILE_COLORS_MAP).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? TEXTILE_COLORS_MAP[key] : '#000000';
};

/**
 * Convertit un code HEX (#RRGGBB) en tableau [r, g, b, a] normalisé [0–1]
 * pour l'API pbrMetallicRoughness de model-viewer.
 */
const hexToRgbaFactor = (hex: string): [number, number, number, number] => {
    if (!hex || hex.length < 7) return [1, 1, 1, 1];
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductVariant {
    id: number | string;
    colorName: string;
    colorCode: string;
    images: string[];
    stock_quantity?: number;
    /** SKU optionnel pour synchronisation commande */
    sku?: string;
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
    /**
     * URL du modèle 3D .glb / .gltf (optionnel).
     * Si absent → fallback sur l'image 2D.
     * Ex: "https://res.cloudinary.com/.../tshirt_blanc.glb"
     */
    model_url?: string;
}

interface ProductDetailsProps {
    onAddToCart: (product: any) => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────
const ProductDetails: React.FC<ProductDetailsProps> = ({ onAddToCart }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [recentProducts, setRecentProducts] = useState<any[]>([]);

    // Mode couleur libre (color picker) — uniquement en mode 2D (sans modèle 3D)
    const [isCustomColor, setIsCustomColor] = useState(false);
    const [customHex, setCustomHex] = useState('#FF5733');

    // État du viewer 3D
    const [modelLoaded, setModelLoaded] = useState(false);
    const [modelError, setModelError] = useState(false);
    const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

    /**
     * Ref vers le <div> conteneur dans lequel on monte le <model-viewer>
     * via DOM imperatif dans useEffect — évite tous les conflits de types JSX.
     */
    const modelContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Ref vers l'instance model-viewer réelle (HTMLElement enrichi par le CDN).
     * Utilisé pour accéder à l'API JS (model.materials, etc.)
     */
    const modelViewerRef = useRef<ModelViewerElement | null>(null);

    // Champ caché synchronisé avec la couleur active → transmis au panier
    const hiddenColorRef = useRef<HTMLInputElement>(null);

    const variantRefs = useRef<Record<number | string, HTMLButtonElement | null>>({});
    const toggleWishlist = useWishlistStore(state => state.toggleItem);
    const isInWishlist = useWishlistStore(state => product ? state.isInWishlist(product.id) : false);

    const availableStock = selectedVariant?.stock_quantity || 0;
    const isOutOfStock = availableStock <= 0;

    // ─── Ajustement quantité si stock change ────────────────────────────────
    useEffect(() => {
        if (!selectedVariant) return;
        if (availableStock <= 0) setQuantity(1);
        else if (quantity > availableStock) setQuantity(availableStock);
    }, [selectedVariant, availableStock, quantity]);

    // ─── Fetch produit ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await authFetch(`/api/products/${slug}`);
                if (!response || !response.ok) throw new Error("Produit introuvable");
                const rawData = await safeParseJson(response);

                let parsedSizes: string[] = [];
                try {
                    parsedSizes = typeof rawData.attributes === 'string'
                        ? JSON.parse(rawData.attributes)
                        : rawData.attributes || [];
                } catch (e) { console.error(e); }

                const allVariants: ProductVariant[] = [];
                const seenColors = new Set<string>();

                if (rawData.image_url) {
                    const mainColorName = rawData.color || "Standard";
                    allVariants.push({
                        id: 'main',
                        colorName: mainColorName,
                        colorCode: getColorHex(mainColorName),
                        images: [rawData.image_url],
                        stock_quantity: rawData.stock_quantity,
                        sku: rawData.sku || undefined,
                    });
                    seenColors.add(mainColorName.toLowerCase());
                }

                if (rawData.variants && Array.isArray(rawData.variants)) {
                    rawData.variants.forEach((v: any) => {
                        const vName = v.colorName || v.color_name;
                        if (vName && !seenColors.has(vName.toLowerCase())) {
                            let vImages: string[] = [];
                            try {
                                vImages = typeof v.images === 'string' ? JSON.parse(v.images) : v.images;
                            } catch { vImages = []; }
                            if (vImages.length === 0 && rawData.image_url) vImages = [rawData.image_url];

                            allVariants.push({
                                id: v.id,
                                colorName: vName,
                                colorCode: getColorHex(vName),
                                images: vImages,
                                stock_quantity: v.stock_quantity,
                                sku: v.sku || undefined,
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
                    sizes: parsedSizes.length > 0 ? parsedSizes : ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
                    variants: allVariants,
                    image_url: rawData.image_url,
                    collection_id: rawData.collection_id,
                    model_url: rawData.model_url || undefined,
                };

                setProduct(cleanProduct);
                if (allVariants.length > 0) setSelectedVariant(allVariants[0]);
                // Si pas de modèle 3D disponible → basculer en vue 2D directement
                if (!cleanProduct.model_url) setViewMode('2d');

            } catch (err: any) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchProduct();
    }, [slug]);

    // ─── Historique récemment consultés ────────────────────────────────────
    useEffect(() => {
        if (!product) return;
        try {
            const stored = localStorage.getItem('recentlyViewed');
            let history: any[] = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(history)) history = [];
            history = history.filter((p: any) => p.id !== product.id);
            const minimalProduct = {
                id: product.id, name: product.name, price: product.price,
                image_url: product.image_url, category: product.category_name, slug
            };
            history.unshift(minimalProduct);
            if (history.length > 8) history = history.slice(0, 8);
            localStorage.setItem('recentlyViewed', JSON.stringify(history));
            setRecentProducts(history.filter((p: any) => p.id !== product.id));
        } catch (error) { console.error(error); }
    }, [product, slug]);

    // ─────────────────────────────────────────────────────────────────────────
    // 🎨 MOTEUR DE RECOLORISATION 3D — cœur du configurateur
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Met à jour le champ caché selected_color.
     * Priorité : SKU du variant → HEX libre.
     * Déclaré AVANT applyColorToModel car utilisé dans sa closure.
     */
    const syncHiddenColor = useCallback((hexOrSku: string) => {
        if (hiddenColorRef.current) {
            hiddenColorRef.current.value = hexOrSku;
        }
    }, []);

    /**
     * Applique une couleur HEX sur le(s) matériau(x) tissu du modèle 3D.
     *
     * L'API model-viewer expose `modelViewer.model.materials[]` qui correspond
     * exactement aux matériaux nommés dans Blender lors de l'export GLTF.
     *
     * Stratégie de ciblage :
     *   1. Cherche un matériau dont le nom contient un mot-clé tissu.
     *   2. Fallback : applique sur TOUS les matériaux (modèle à matériau unique).
     *
     * ⚠️ Pour un ciblage précis, nommer le matériau "Tshirt_Material" dans Blender.
     *    Voir DOCS_3D_VIEWER.md pour le guide complet.
     */
    const applyColorToModel = useCallback((hex: string) => {
        const mv = modelViewerRef.current;
        if (!mv?.model?.materials) return;

        const rgbaFactor = hexToRgbaFactor(hex);
        const materials = mv.model.materials;

        // Mots-clés identifiant le matériau principal du vêtement
        const FABRIC_KEYWORDS = [
            'fabric', 'tissu', 'tshirt', 't-shirt', 'shirt',
            'body', 'cloth', 'garment', 'textile', 'material'
        ];

        const fabricMaterials = materials.filter(mat =>
            FABRIC_KEYWORDS.some(kw => mat.name.toLowerCase().includes(kw))
        );

        const targets = fabricMaterials.length > 0 ? fabricMaterials : materials;

        targets.forEach(mat => {
            mat.pbrMetallicRoughness.setBaseColorFactor(rgbaFactor);
        });

        // Synchroniser le champ caché pour le panier
        syncHiddenColor(hex);
    }, [syncHiddenColor]);

    // ─── Montage impératif du <model-viewer> via DOM ──────────────────────
    /**
     * On monte le Web Component via DOM imperatif au lieu de JSX.
     * Raison : les Custom Elements ont des attributs non-standards
     * (camera-controls, shadow-intensity, etc.) que TypeScript/JSX ne connaît pas.
     * Cette approche est 100% type-safe et identique fonctionnellement.
     */
    useEffect(() => {
        const container = modelContainerRef.current;
        if (!container || !product?.model_url || viewMode !== '3d') return;

        // Créer l'élément model-viewer
        const mv = document.createElement('model-viewer') as ModelViewerElement;

        // Attributs standards
        mv.setAttribute('id', `model-viewer-${product.id}`);
        mv.setAttribute('src', product.model_url);
        mv.setAttribute('alt', `Modèle 3D de ${product.name}`);

        // Attributs model-viewer spécifiques
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('shadow-intensity', '1.2');
        mv.setAttribute('shadow-softness', '0.8');
        mv.setAttribute('exposure', '1.0');
        mv.setAttribute('tone-mapping', 'commerce');
        mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('loading', 'eager');
        mv.setAttribute('reveal', 'auto');
        mv.setAttribute('camera-orbit', '0deg 75deg 2.5m');
        mv.setAttribute('min-camera-orbit', 'auto 0deg auto');
        mv.setAttribute('max-camera-orbit', 'auto 160deg auto');

        // Styles CSS — positionnement absolu dans son conteneur
        mv.style.position = 'absolute';
        mv.style.top = '0';
        mv.style.right = '0';
        mv.style.bottom = '0';
        mv.style.left = '0';
        mv.style.width = '100%';
        mv.style.height = '100%';
        mv.style.backgroundColor = 'transparent';

        // Events natifs — pas de conflits JSX
        const onLoad = () => {
            setModelLoaded(true);
            setModelError(false);
            // Appliquer la couleur initiale dès que le modèle est prêt
            setTimeout(() => {
                if (modelViewerRef.current) {
                    const initialHex = selectedVariant?.colorCode || '#FFFFFF';
                    applyColorToModel(initialHex);
                }
            }, 100);
        };

        const onError = () => {
            setModelError(true);
            setViewMode('2d');
        };

        mv.addEventListener('load', onLoad);
        mv.addEventListener('error', onError);

        // Stocker la ref pour l'API JS
        modelViewerRef.current = mv;

        // Injecter dans le DOM
        container.innerHTML = '';
        container.appendChild(mv);

        return () => {
            mv.removeEventListener('load', onLoad);
            mv.removeEventListener('error', onError);
            if (container.contains(mv)) container.removeChild(mv);
            modelViewerRef.current = null;
            setModelLoaded(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.model_url, product?.id, viewMode]);

    // Appliquer la couleur à chaque changement de variant ou de couleur libre
    useEffect(() => {
        if (!selectedVariant || viewMode !== '3d' || !modelLoaded) return;
        const hex = isCustomColor ? customHex : selectedVariant.colorCode;
        applyColorToModel(hex);
    }, [selectedVariant, isCustomColor, customHex, modelLoaded, viewMode, applyColorToModel]);

    // ─── Handlers variant / panier ──────────────────────────────────────────
    const handleVariantSelect = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        setCurrentImageIndex(0);
        setIsCustomColor(false);
        syncHiddenColor(variant.sku || variant.colorCode);
    };

    const handleCustomize = () => {
        if (!product) return;
        navigate('/personnaliser/mon-design', {
            state: {
                productId: product.id,
                variantId: selectedVariant?.id,
                colorName: isCustomColor ? customHex : selectedVariant?.colorName,
                sizeName: selectedSize
            }
        });
    };

    const handleAddToCart = () => {
        if (!product) return;
        if (isOutOfStock && !isCustomColor) return;
        if (!selectedSize) { showToast("⚠️ Veuillez sélectionner une taille !", "warning"); return; }

        const colorName = isCustomColor
            ? `Personnalisé (${customHex.toUpperCase()})`
            : selectedVariant?.colorName;
        const colorCode = isCustomColor ? customHex : selectedVariant?.colorCode;
        const selectedColorValue = hiddenColorRef.current?.value || colorCode;

        const uniqueCartId = `${product.id}-${isCustomColor ? customHex.replace('#', '') : selectedVariant?.id}-${selectedSize}`;
        const isMainProduct = selectedVariant?.id === 'main';

        const cartItemPayload = {
            id: uniqueCartId,
            product_id: product.id,
            name: isCustomColor ? `${product.name} (Couleur Sur Mesure)` : product.name,
            price: product.price,
            quantity: quantity,
            image: selectedVariant?.images[0] || product.image_url,
            options: {
                size: selectedSize,
                color: colorName,
                colorHex: colorCode,
                isCustomColor: isCustomColor,
                variant_id: isMainProduct ? null : selectedVariant?.id,
                selected_color: selectedColorValue,
                customization: isCustomColor
                    ? JSON.stringify({ customColorHex: customHex, type: 'custom_color_3d' })
                    : null,
            }
        };
        onAddToCart(cartItemPayload);
        showToast("✅ Article ajouté au panier avec succès !", "success");
    };

    // ─── Rendu ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-theme-primary" />
        </div>
    );
    if (!product) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">
            Produit introuvable
        </div>
    );

    const displayImage = selectedVariant && selectedVariant.images.length > 0
        ? selectedVariant.images[currentImageIndex]
        : (product.image_url || "/placeholder.png");

    const activeColorHex = isCustomColor ? customHex : (selectedVariant?.colorCode || '#000000');
    const has3DModel = !!product.model_url && !modelError;

    return (
        <div className="bg-white min-h-screen pb-16 animate-in fade-in duration-500">

            {/* Champ caché — synchronisé avec la couleur active pour le panier */}
            <input
                ref={hiddenColorRef}
                type="hidden"
                name="selected_color"
                defaultValue={selectedVariant?.sku || selectedVariant?.colorCode || ''}
            />

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">

                {/* Navigation Retour */}
                <button
                    onClick={() => navigate('/boutique')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 group transition-colors"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Retour à la boutique
                </button>

                {/* VUE PRINCIPALE */}
                <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-12 items-start">

                    {/* ── GAUCHE : VISUALISEUR 3D OU IMAGE 2D ── */}
                    <div className="flex flex-col gap-4 md:sticky md:top-24 mb-4 md:mb-0">

                        {/* Basculeur 3D ↔ 2D — affiché uniquement si un modèle existe */}
                        {has3DModel && (
                            <div className="flex items-center gap-2 self-end">
                                <button
                                    onClick={() => setViewMode('3d')}
                                    title="Vue 3D interactive"
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        viewMode === '3d'
                                            ? 'bg-theme-primary text-white border-theme-primary shadow-md'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    <Box size={13} /> Vue 3D
                                </button>
                                <button
                                    onClick={() => setViewMode('2d')}
                                    title="Photo produit"
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        viewMode === '2d'
                                            ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    <ImageIcon size={13} /> Photo
                                </button>
                            </div>
                        )}

                        {/* ─── ZONE VISUELLE PRINCIPALE ─── */}
                        <div
                            className="relative w-full h-[42vh] md:h-auto md:aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
                            style={{
                                background: viewMode === '3d' && has3DModel
                                    ? `radial-gradient(ellipse at center, ${activeColorHex}18 0%, #f8fafc 70%)`
                                    : '#f8fafc'
                            }}
                        >

                            {/* ── MODE 3D : conteneur DOM impératif (model-viewer monté via useEffect) ── */}
                            {viewMode === '3d' && has3DModel && (
                                <>
                                    {/*
                                     * Ce <div> sert de point de montage pour le Web Component <model-viewer>.
                                     * Le composant est créé via document.createElement() dans le useEffect
                                     * ci-dessus — aucun conflit de type TypeScript.
                                     */}
                                    <div
                                        ref={modelContainerRef}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                        }}
                                        aria-label={`Modèle 3D de ${product.name}`}
                                    />

                                    {/* Spinner pendant le chargement du modèle */}
                                    {!modelLoaded && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-white/80 backdrop-blur-sm pointer-events-none">
                                            <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
                                            <span className="text-xs text-slate-500 font-medium">Chargement du modèle 3D…</span>
                                        </div>
                                    )}

                                    {/* Badge 3D actif */}
                                    {modelLoaded && (
                                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 pointer-events-none">
                                            <Box size={11} className="text-white" />
                                            <span className="text-[10px] font-bold text-white tracking-wide">3D INTERACTIF</span>
                                        </div>
                                    )}

                                    {/* Badge couleur active 3D */}
                                    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md border border-slate-100 transition-all pointer-events-none">
                                        <div
                                            className="w-4 h-4 rounded-full border border-white shadow-inner flex-shrink-0"
                                            style={{ backgroundColor: activeColorHex }}
                                        />
                                        <span className="text-xs font-bold text-slate-700">
                                            {isCustomColor ? customHex.toUpperCase() : selectedVariant?.colorName}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* ── MODE 2D : image classique ── */}
                            {(viewMode === '2d' || !has3DModel) && (
                                <>
                                    <SafeImage
                                        src={displayImage}
                                        alt={product.name}
                                        className={`w-full h-full object-contain p-4 object-center transition-transform duration-500 hover:scale-105 ${isOutOfStock && !isCustomColor ? 'opacity-60' : ''}`}
                                    />

                                    {/* Badge couleur active 2D */}
                                    {isCustomColor && (
                                        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md border border-slate-100">
                                            <div
                                                className="w-4 h-4 rounded-full border border-white shadow-inner flex-shrink-0"
                                                style={{ backgroundColor: customHex }}
                                            />
                                            <span className="text-xs font-bold text-slate-700">{customHex.toUpperCase()}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Badge ÉPUISÉ */}
                            {isOutOfStock && !isCustomColor && (
                                <div className="absolute top-4 left-4 bg-red-600/90 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm z-10 flex items-center gap-1.5 backdrop-blur-md">
                                    <AlertCircle size={16} /> ÉPUISÉ
                                </div>
                            )}
                        </div>

                        {/* Miniatures — mode 2D uniquement */}
                        {(viewMode === '2d' || !has3DModel) && selectedVariant && selectedVariant.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-center md:justify-start">
                                {selectedVariant.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        title={`Image ${idx + 1}`}
                                        className={`w-14 h-14 rounded-lg border overflow-hidden flex-shrink-0 transition-all ${
                                            currentImageIndex === idx
                                                ? 'ring-1 border-theme-primary ring-theme-primary'
                                                : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                                        }`}
                                    >
                                        <SafeImage src={img} className="w-full h-full object-contain p-1" alt={`Miniature ${idx + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Aide rotation — mode 3D */}
                        {viewMode === '3d' && modelLoaded && (
                            <p className="text-center text-xs text-slate-400 font-medium">
                                🖱️ Glissez pour faire tourner · Molette pour zoomer
                            </p>
                        )}
                    </div>

                    {/* ── DROITE : INFOS & ACTIONS ── */}
                    <div className="flex flex-col gap-5">

                        {/* Titre + wishlist + partage */}
                        <div className="border-b border-slate-100 pb-4">
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight flex-1">
                                    {product.name}
                                </h1>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => product && toggleWishlist(product)}
                                        className={`p-1 transition-colors ${isInWishlist ? 'text-rose-500' : 'text-slate-400 hover-theme-text'}`}
                                        title={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                                    >
                                        <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
                                    </button>
                                    <button className="text-slate-400 hover-theme-text p-1" title="Partager">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold text-theme-primary">{formatCurrency(product.price)}</span>
                                    <span className="text-xs text-slate-500 font-medium">TTC</span>
                                </div>
                                <div className="flex items-center gap-1 text-amber-400 text-sm bg-amber-50 px-2 py-1 rounded-full">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                    <span className="text-xs text-amber-700 ml-1 font-medium">4.8/5</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Sélecteur Couleur ── */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-700">
                                    Couleur :{' '}
                                    <span className="font-normal capitalize">
                                        {isCustomColor
                                            ? `Sur mesure (${customHex.toUpperCase()})`
                                            : selectedVariant?.colorName}
                                    </span>
                                </span>

                                {/* Color picker libre uniquement en mode 2D */}
                                {(!has3DModel || viewMode === '2d') ? (
                                    <button
                                        onClick={() => setIsCustomColor(!isCustomColor)}
                                        className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
                                    >
                                        <Palette size={12} />
                                        {isCustomColor ? 'Voir pastilles stock' : 'Couleur libre 🎨'}
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-bold text-theme-primary bg-blue-50 px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                                        <Box size={10} /> Couleur en temps réel 3D
                                    </span>
                                )}
                            </div>

                            {/* Pastilles variants catalogue */}
                            {!isCustomColor && (
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            ref={el => {
                                                variantRefs.current[variant.id] = el;
                                                if (el) el.style.setProperty('--variant-color', variant.colorCode);
                                            }}
                                            onClick={() => handleVariantSelect(variant)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border bg-dynamic-variant ${
                                                selectedVariant?.id === variant.id
                                                    ? 'ring-2 ring-offset-2 scale-110 border-transparent ring-theme-primary'
                                                    : 'border-slate-200 hover:border-slate-400'
                                            }`}
                                            title={variant.colorName}
                                        >
                                            {variant.colorName === 'Blanc' && (
                                                <div className="absolute inset-0 rounded-full border border-black/10 pointer-events-none" />
                                            )}
                                            {selectedVariant?.id === variant.id && (
                                                <Check
                                                    size={16}
                                                    className={['Blanc', 'Jaune'].includes(variant.colorName) ? 'text-slate-900' : 'text-white'}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Color picker libre — mode 2D uniquement */}
                            {isCustomColor && (
                                <div className="space-y-3 bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={customHex}
                                            onChange={(e) => {
                                                setCustomHex(e.target.value);
                                                syncHiddenColor(e.target.value);
                                            }}
                                            className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={customHex.toUpperCase()}
                                                onChange={(e) => {
                                                    setCustomHex(e.target.value);
                                                    syncHiddenColor(e.target.value);
                                                }}
                                                className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                                                placeholder="#FF5733"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-amber-700 font-medium">
                                        💡 Mode 2D — Pour la recolorisation 3D temps réel, activez la Vue 3D et sélectionnez une pastille.
                                    </p>
                                </div>
                            )}

                            {/* Color picker inline — mode 3D actif */}
                            {has3DModel && viewMode === '3d' && modelLoaded && !isCustomColor && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[11px] text-slate-500 font-medium mb-2">
                                        🎨 Couleur personnalisée appliquée directement sur le matériau 3D :
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            defaultValue={selectedVariant?.colorCode || '#FFFFFF'}
                                            onChange={(e) => applyColorToModel(e.target.value)}
                                            className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent"
                                            title="Choisir une couleur libre"
                                        />
                                        <span className="text-xs text-slate-500">ou sélectionnez une pastille ci-dessus</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Sélecteur Taille ── */}
                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-sm font-bold text-slate-700">
                                    Taille :{' '}
                                    <span className={`font-normal ${!selectedSize ? 'text-theme-primary' : ''}`}>
                                        {selectedSize || 'Requise'}
                                    </span>
                                </span>
                                <button className="text-xs text-slate-500 underline hover-theme-text flex items-center gap-1">
                                    <Ruler size={12} /> Guide des tailles
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        aria-label={`Taille ${size}`}
                                        className={`min-w-[3rem] h-10 px-2 rounded-md text-sm font-bold border transition-colors ${
                                            selectedSize === size
                                                ? 'text-white shadow-md bg-theme-primary border-theme-primary'
                                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message de stock */}
                        {isOutOfStock && !isCustomColor ? (
                            <div className="text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-red-100">
                                <AlertCircle size={18} /> Rupture de stock pour cette couleur.
                            </div>
                        ) : (availableStock <= 5 && availableStock > 0 && !isCustomColor) ? (
                            <div className="text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-amber-100">
                                <AlertCircle size={18} /> Plus que {availableStock} article(s) en stock !
                            </div>
                        ) : null}

                        {/* ── Actions panier ── */}
                        <div className="space-y-3 pt-2">
                            <div className="flex gap-3 h-12">

                                {/* Quantité */}
                                <div className="flex items-center border border-slate-300 rounded-lg w-28 bg-white flex-shrink-0 overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={(isOutOfStock && !isCustomColor) || quantity <= 1}
                                        title="Diminuer la quantité"
                                        className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-100 font-bold text-lg transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className={`flex-1 text-center font-bold text-base ${isOutOfStock && !isCustomColor ? 'text-slate-400' : 'text-slate-900'}`}>
                                        {isOutOfStock && !isCustomColor ? 0 : quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(Math.min(availableStock || 99, quantity + 1))}
                                        disabled={isOutOfStock && !isCustomColor}
                                        title="Augmenter la quantité"
                                        className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-100 font-bold text-lg transition-colors"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Bouton Ajouter au panier */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!selectedSize || (isOutOfStock && !isCustomColor)}
                                    style={{ backgroundColor: selectedSize ? 'var(--theme-primary)' : undefined }}
                                    className={`flex-1 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-white ${
                                        (isOutOfStock && !isCustomColor) || !selectedSize
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                            : 'hover:opacity-95'
                                    }`}
                                >
                                    <ShoppingCart size={18} />
                                    {(isOutOfStock && !isCustomColor)
                                        ? 'Épuisé'
                                        : selectedSize ? 'Ajouter au panier' : 'Choisir Taille'
                                    }
                                </button>
                            </div>

                            {/* Bouton Personnaliser design */}
                            <button
                                onClick={handleCustomize}
                                disabled={isOutOfStock}
                                className={`w-full h-10 border-2 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                    isOutOfStock
                                        ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-white hover:bg-slate-50 text-theme-primary border-theme-primary'
                                }`}
                            >
                                <Palette size={16} /> Personnaliser ce design
                            </button>
                        </div>

                        {/* Livraison + description */}
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-3 border border-slate-100 mt-2">
                            <div className="flex items-center gap-3 text-green-700 font-medium">
                                <Truck size={18} />
                                <span>Livraison disponible sous 24h/48h</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                                <p className="leading-relaxed text-xs sm:text-sm">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Recommandations ── */}
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
                .hover-theme-text:hover { color: var(--theme-primary) !important; }
                .bg-dynamic-variant { background-color: var(--variant-color) !important; }
            `}</style>
        </div>
    );
};

export default ProductDetails;