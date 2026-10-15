import React, { useState, useEffect } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { Edit, Plus, Trash2, XCircle, Tag, Layers, Check, Image as ImageIcon, Search, Palette, ChevronRight, ChevronLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SafeImage from '../../src/components/tools/SafeImage';
import Pagination from '../../src/components/tools/Pagination';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import { ConfirmDestructiveModal } from '../../src/components/admin/ConfirmDestructiveModal';
import { useFormDraft } from '../../src/utils/hooks/useFormDraft';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

// 🎨 PALETTE DE COULEURS STANDARD
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

const INITIAL_FORM_DATA = {
  name: '',
  category: 'unisexe',
  collection_id: '',
  category_id: '',
  price: '',
  description: '',
  stock_quantity: 0,
  image_url: '',
  color: 'Blanc'
};

export const ProductView = () => {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  // --- FILTRAGE ET RECHERCHE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredProducts = React.useMemo(() => {
    return products.filter((product: any) => {
      // 1. Recherche Textuelle
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 2. Filtre Catégorie
      const matchesCategory = categoryFilter === 'all' || String(product.category_id) === categoryFilter;
      
      // 3. Filtre Collection
      const matchesCollection = collectionFilter === 'all' || String(product.collection_id) === collectionFilter;
      
      // 4. Filtre Stock
      let matchesStock = true;
      if (stockFilter === 'out') matchesStock = product.stock_quantity <= 0;
      else if (stockFilter === 'low') matchesStock = product.stock_quantity > 0 && product.stock_quantity <= 10;
      else if (stockFilter === 'available') matchesStock = product.stock_quantity > 10;

      return matchesSearch && matchesCategory && matchesCollection && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, collectionFilter, stockFilter]);

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Réinitialiser la page si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, collectionFilter, stockFilter]);

  // Typage explicite pour éviter les erreurs TypeScript
  const [variants, setVariants] = useState<{ colorName: string, colorCode: string, stockQuantity: number | string, files: File[] }[]>([
    { colorName: TEXTILE_COLORS[0].name, colorCode: TEXTILE_COLORS[0].hex, stockQuantity: 0, files: [] }
  ]);
  
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🪜 STEPPER (1: Général, 2: Tailles & Visuel, 3: Variantes & Validation)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 🛡️ DOUBLE-SUBMIT & DESTRUCTIVE MODAL
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteProductTarget, setDeleteProductTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 📝 BROUILLON AUTOMATIQUE (useFormDraft)
  const {
    formData,
    setFormData,
    hasRestoredDraft,
    clearDraft,
    resetForm: resetDraft
  } = useFormDraft('admin_product_form', INITIAL_FORM_DATA, { enabled: !editingId });

  // ⌨️ FERMETURE MODAL AVEC ÉCHAP
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isSubmitting) {
        resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, collectionsRes, categoriesRes] = await Promise.all([
          authFetch('/api/products/get-product'),
          authFetch('/api/collections'),
          authFetch('/api/categories')
      ]);
      
      // 1. On extrait les données
      const rawProducts = await productsRes.json();
      const rawCollections = await collectionsRes.json();
      const rawCategories = await categoriesRes.json();

      // 🔄 2. LE TRI MAGIQUE : Du plus récent au plus ancien (basé sur l'ID)
      const sortedProducts = rawProducts.sort((a: any, b: any) => b.id - a.id);

      // 3. On sauvegarde dans les states
      setProducts(sortedProducts);
      setCollections(rawCollections);
      setCategories(rawCategories);

    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🪄 LOGIQUE DE MISE EN ÉVIDENCE (Highlight)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get('highlight');
    
    if (highlightId && !loading && products.length > 0) {
      // Petit délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        const element = document.getElementById(`product-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-glow');
          
          // Retirer la classe après l'animation (3s définie dans GlobalUX.css)
          setTimeout(() => {
            element.classList.remove('highlight-glow');
          }, 3500);
        }
      }, 500);
    }
  }, [location.search, loading, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
      const newVariants = [...variants];
      // @ts-ignore
      newVariants[index][field] = value;
      setVariants(newVariants);
  };

  const setVariantColor = (index: number, colorObj: typeof TEXTILE_COLORS[0]) => {
      const newVariants = [...variants];
      newVariants[index].colorName = colorObj.name;
      newVariants[index].colorCode = colorObj.hex;
      setVariants(newVariants);
  };

  const handleVariantFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newVariants = [...variants];
          newVariants[index].files = Array.from(e.target.files); 
          setVariants(newVariants);
      }
  };

  const addVariant = () => {
      setVariants([...variants, { colorName: TEXTILE_COLORS[0].name, colorCode: TEXTILE_COLORS[0].hex, stockQuantity: 0, files: [] }]);
  };

  const removeVariant = (index: number) => {
      setVariants(variants.filter((_, i) => i !== index));
  };

  const resetForm = () => {
      setEditingId(null);
      setCurrentStep(1);
      resetDraft(INITIAL_FORM_DATA);
      setSelectedSizes([]);
      setSelectedFile(null);
      setVariants([{ colorName: TEXTILE_COLORS[0].name, colorCode: TEXTILE_COLORS[0].hex, stockQuantity: 0, files: [] }]);
      setIsModalOpen(false);
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setCurrentStep(1);
    
    let parsedSizes = [];
    try {
      if (product.attributes) {
          parsedSizes = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      }
    } catch (e) { console.error(e); }
    setSelectedSizes(Array.isArray(parsedSizes) ? parsedSizes : []);

    let parsedVariants = [];
    try {
        if (product.variants && Array.isArray(product.variants)) parsedVariants = product.variants;
        else if (typeof product.variants === 'string') parsedVariants = JSON.parse(product.variants);
    } catch(e) { console.error("Erreur parsing variantes", e); }

    if (parsedVariants.length > 0) {
        const formattedVariants = parsedVariants.map((v: any) => ({
            colorName: v.colorName || v.color_name || TEXTILE_COLORS[0].name,
            colorCode: v.colorCode || v.color_code || TEXTILE_COLORS[0].hex,
            stockQuantity: v.stockQuantity || v.stock_quantity || 0,
            files: [] 
        }));
        setVariants(formattedVariants);
    } else {
        setVariants([{ colorName: TEXTILE_COLORS[0].name, colorCode: TEXTILE_COLORS[0].hex, stockQuantity: 0, files: [] }]);
    }

    setFormData({
        name: product.name,
        category: product.category || 'unisexe',
        price: product.price,
        collection_id: product.collection_id || '',
        category_id: product.category_id || '',
        description: product.description || '',
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || '',
        color: product.color || 'Blanc'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // 🛡️ Prévention du double-submit

    const token = localStorage.getItem('token');
    setIsSubmitting(true);

    try {
        let mainImageBase64 = null;
        if (selectedFile) {
            mainImageBase64 = await fileToBase64(selectedFile);
        }

        const variantsWithBase64 = await Promise.all(variants.map(async (v) => {
            const filesBase64 = await Promise.all(v.files.map(f => fileToBase64(f)));
            return {
                colorName: v.colorName,
                colorCode: v.colorCode,
                stockQuantity: v.stockQuantity,
                images_base64: filesBase64 
            };
        }));

        const payload = {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            collection_id: formData.collection_id,
            category_id: formData.category_id,
            price: formData.price,
            stock_quantity: formData.stock_quantity,
            attributes: JSON.stringify(selectedSizes),
            color: formData.color,
            image_base64: mainImageBase64, 
            variants: variantsWithBase64, 
            existing_image_url: formData.image_url 
        };

        const url = editingId ? `/api/products/update-product/${editingId}` : '/api/products/create-product';
        const method = editingId ? 'PUT' : 'POST';

        const response = await authFetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            useNotificationStore.getState().addNotification({
                title: editingId ? "Produit modifié" : "Produit créé",
                message: "L'opération a été réalisée avec succès dans le catalogue.",
                type: "success"
            });
            clearDraft(); // 🧹 Nettoyage du brouillon après succès
            fetchData();
            resetForm();
        } else {
            const errorData = await response.json();
            useNotificationStore.getState().addNotification({
                title: "Erreur Backend",
                message: errorData.message || errorData.error || "Mise à jour refusée.",
                type: "error"
            });
        }

    } catch (error: any) {
        console.error("ERREUR:", error);
        useNotificationStore.getState().addNotification({
            title: "Erreur technique",
            message: error.message || "Impossible de joindre le serveur.",
            type: "error"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;
    setIsDeleting(true);
    const token = localStorage.getItem('token');
    try {
        const response = await authFetch(`/api/products/delete-product/${deleteProductTarget.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            setProducts(prev => prev.filter((p:any) => p.id !== deleteProductTarget.id));
            useNotificationStore.getState().addNotification({
                title: "Suppression confirmée",
                message: `Le produit « ${deleteProductTarget.name} » a bien été retiré.`,
                type: "success"
            });
            setDeleteProductTarget(null);
        } else {
            const err = await response.json().catch(() => ({}));
            useNotificationStore.getState().addNotification({
                title: "Erreur de suppression",
                message: err.message || "Impossible de retirer ce produit. Il est potentiellement lié à des commandes.",
                type: "error"
            });
        }
    } catch (error) { 
        console.error(error); 
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-[100vw] overflow-x-hidden">
      
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm w-full">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span 
                 className="p-2 rounded-lg"
                 style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
             >
                <Tag size={24} />
             </span>
             Inventaire
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez vos articles, tailles et stocks.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ backgroundColor: 'var(--theme-primary)' }}
          className="w-full sm:w-auto text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-95 hover:opacity-100 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Nouveau Produit</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Recherche */}
        <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text"
                placeholder="Rechercher un produit ou tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-slate-200 transition-all outline-none"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <XCircle size={16} />
                </button>
            )}
        </div>

        {/* Catégorie */}
        <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-200 outline-none cursor-pointer"
        >
            <option value="all">Toutes les coupes</option>
            {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>

        {/* Collection */}
        <select 
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-200 outline-none cursor-pointer"
        >
            <option value="all">Tous les thèmes</option>
            {collections.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>

        {/* Stock */}
        <select 
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-200 outline-none cursor-pointer"
        >
            <option value="all">Tout le stock</option>
            <option value="available">Disponible (&gt;10)</option>
            <option value="low">Stock faible (1-10)</option>
            <option value="out">Rupture (0)</option>
        </select>
      </div>

      {/* --- LISTE DES PRODUITS --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
        {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div 
                    className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-4"
                    style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', borderTopColor: 'var(--theme-primary)' }}
                ></div>
                Chargement...
            </div>
        ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Aucun produit ne correspond à vos critères.</p>
            </div>
        ) : (
            <>
                {/* 1. VUE TABLEAU (DESKTOP SEULEMENT) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                        <th className="px-6 py-4 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Produit</th>
                        <th className="px-6 py-4">Couleur</th>
                        <th className="px-6 py-4">Catégorie</th>
                        <th className="px-6 py-4">Prix</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedProducts.map((product: any) => (
                        <tr key={product.id} id={`product-${product.id}`} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                        <SafeImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-slate-700">{product.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                                    {product.color || '-'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 capitalize">{product.category_name || product.category}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{parseFloat(product.price).toLocaleString('fr-FR')} FCFA</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock_quantity}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditClick(product)} 
                                        title="Modifier"
                                        className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-all border border-slate-200 shadow-xs"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => setDeleteProductTarget(product)} 
                                        title="Supprimer définitivement"
                                        className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200 shadow-xs"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* 2. VUE CARTES (MOBILE SEULEMENT) */}
                <div className="md:hidden divide-y divide-slate-100 bg-slate-50/50 w-full">
                    {paginatedProducts.map((product: any) => (
                        <div key={product.id} id={`product-card-${product.id}`} className="p-4 bg-white mb-2 shadow-sm first:mt-0 last:mb-0 w-full animate-fade-in">
                             
                             {/* En-tête Carte */}
                             <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                                    <div className="w-12 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                        <SafeImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Produit</span>
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
                                        <div className="text-xs text-slate-500 capitalize truncate">{product.category_name || product.category}</div>
                                    </div>
                                </div>
                                <span className={`flex-shrink-0 ml-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    Stock: {product.stock_quantity}
                                </span>
                             </div>

                             {/* Détails Carte */}
                             <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 mb-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Palette size={14}/> Couleur</span>
                                    <span className="font-medium text-slate-700">{product.color || 'Blanc'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Tag size={14}/> Prix</span>
                                    <span className="font-black text-slate-900">{parseFloat(product.price).toLocaleString('fr-FR')} FCFA</span>
                                </div>
                             </div>

                             {/* Actions Carte */}
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditClick(product)} 
                                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <Edit size={16}/> Modifier
                                </button>
                                <button 
                                    onClick={() => setDeleteProductTarget(product)} 
                                    className="flex-1 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-red-100 transition-colors shadow-sm"
                                >
                                    <Trash2 size={16}/> Supprimer
                                </button>
                             </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <Pagination 
                        currentPage={currentPage}
                        totalItems={filteredProducts.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </>
        )}
      </div>

      {/* --- MODAL FORMULAIRE AVEC STEPPER ET SAUVEGARDE BROUILLON --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {editingId ? 'Mode Édition' : 'Création Catalogue'}
                </span>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-1">
                    {editingId 
                        ? <Edit size={20} style={{ color: 'var(--theme-primary)' }}/> 
                        : <Plus size={20} style={{ color: 'var(--theme-primary)' }}/>
                    }
                    {editingId ? 'Modifier le Produit' : 'Nouveau Produit'}
                </h3>
              </div>
              <button 
                onClick={resetForm} 
                disabled={isSubmitting}
                className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200 disabled:opacity-50"
              >
                  <XCircle size={20} />
              </button>
            </div>

            {/* Notification de Brouillon Restauré */}
            {hasRestoredDraft && !editingId && (
              <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  Brouillon non soumis restauré automatiquement depuis votre session.
                </span>
                <button 
                  type="button" 
                  onClick={clearDraft}
                  className="font-bold underline text-amber-900 hover:text-amber-950 ml-2"
                >
                  Effacer
                </button>
              </div>
            )}

            {/* Stepper Bar (3 Étapes) */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  currentStep === 1 
                    ? 'bg-slate-100 font-bold text-slate-900 border border-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    currentStep === 1 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  1
                </span>
                <span className="text-xs truncate hidden sm:inline">Infos Générales</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  currentStep === 2 
                    ? 'bg-slate-100 font-bold text-slate-900 border border-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    currentStep === 2 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  2
                </span>
                <span className="text-xs truncate hidden sm:inline">Tailles & Visuel</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  currentStep === 3 
                    ? 'bg-slate-100 font-bold text-slate-900 border border-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    currentStep === 3 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </span>
                <span className="text-xs truncate hidden sm:inline">Variantes & Validation</span>
              </button>
            </div>
            
            {/* Contenu Modal Découpé par Étape */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
              
              {/* ÉTAPE 1 : INFOS GÉNÉRALES */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nom du produit *</label>
                        <input 
                            name="name" value={formData.name} onChange={handleChange} 
                            placeholder="Ex: T-shirt Oversize Coton..." className="input-field" required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prix (FCFA) *</label>
                        <input 
                            name="price" type="number" value={formData.price} onChange={handleChange} 
                            placeholder="5000" className="input-field" required min="0"
                        />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description détaillée</label>
                      <textarea 
                          name="description" value={formData.description} onChange={handleChange} 
                          placeholder="Matières, conseils d'entretien, coupe..." className="input-field h-24 resize-none"
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock Global *</label>
                        <input 
                            name="stock_quantity" type="number" value={formData.stock_quantity} 
                            onChange={handleChange} className="input-field" required min="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Genre / Cible</label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                            {['homme', 'femme', 'enfant', 'unisexe'].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, category: cat}))}
                                    style={formData.category === cat ? { backgroundColor: 'var(--theme-primary)' } : {}}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                                        formData.category === cat 
                                        ? 'text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Collection *</label>
                        <select name="collection_id" onChange={handleChange} value={formData.collection_id} required className="input-field appearance-none cursor-pointer">
                            <option value="">Sélectionner une collection...</option>
                            {collections.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Coupe / Catégorie *</label>
                        <select name="category_id" onChange={handleChange} value={formData.category_id} required className="input-field appearance-none cursor-pointer">
                            <option value="">Sélectionner une coupe...</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : TAILLES & VISUEL PRINCIPAL */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                          <Layers size={14}/> Tailles disponibles pour ce produit
                      </label>
                      <p className="text-xs text-slate-500 mb-2">Cliquez pour activer ou désactiver les tailles vendues.</p>
                      <div className="flex flex-wrap gap-2">
                          {AVAILABLE_SIZES.map(size => (
                              <button
                                  type="button"
                                  key={size}
                                  onClick={() => toggleSize(size)}
                                  style={selectedSizes.includes(size) ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                                  className={`w-11 h-11 rounded-xl font-bold text-sm transition-all border ${
                                      selectedSizes.includes(size) 
                                      ? 'text-white shadow-sm opacity-95 hover:opacity-100' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                  {size}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                          <ImageIcon size={14}/> Image Principale du Produit
                      </label>
                      <input 
                          type="file" 
                          onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                          className="input-field text-sm cursor-pointer file-theme" 
                          accept="image/*"
                      />
                      {formData.image_url && !selectedFile && (
                        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                            <SafeImage src={formData.image_url} alt="Aperçu" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs text-slate-500 truncate">Image actuelle conservée</span>
                        </div>
                      )}
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                          Couleur affichée par défaut (Produit principal)
                      </label>
                      <div className="flex flex-wrap gap-2">
                          {TEXTILE_COLORS.map((color) => (
                              <button
                                  key={color.name}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                                  style={formData.color === color.name ? { borderColor: 'var(--theme-primary)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' } : {}}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                                      formData.color === color.name 
                                      ? 'bg-white' 
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                  }`}
                              >
                                  <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: color.hex }}></div>
                                  {color.name}
                              </button>
                          ))}
                      </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : VARIANTES DE COULEURS & VALIDATION */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Récapitulatif Rapide */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-bold">Produit</span>
                      <strong className="text-slate-800 truncate block">{formData.name || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Prix</span>
                      <strong className="text-slate-800">{formData.price ? `${formData.price} FCFA` : '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Tailles</span>
                      <strong className="text-slate-800">{selectedSizes.length > 0 ? selectedSizes.join(', ') : 'Aucune'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Couleur Base</span>
                      <strong className="text-slate-800">{formData.color || 'Blanc'}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <Palette size={18}/> Variantes de couleurs additionnelles ({variants.length})
                      </h4>
                      <button 
                          type="button" 
                          onClick={addVariant} 
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border"
                          style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' }}
                      >
                          + Ajouter variante
                      </button>
                  </div>
                  
                  {variants.map((v, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative animate-in fade-in slide-in-from-bottom-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Couleur</label>
                                  <div className="flex flex-wrap gap-2">
                                      {TEXTILE_COLORS.map((color) => (
                                          <button
                                                key={color.name}
                                                type="button"
                                                onClick={() => setVariantColor(i, color)}
                                                title={color.name}
                                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110 ${
                                                    v.colorName === color.name 
                                                    ? 'ring-2 ring-offset-2 scale-110 border-transparent' 
                                                    : 'border-slate-300'
                                                }`}
                                                style={{ 
                                                    backgroundColor: color.hex, 
                                                    ...(v.colorName === color.name ? { '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties : {}) 
                                                }}
                                           >
                                              {v.colorName === color.name && (
                                                  <Check size={14} className={color.name === 'Blanc' || color.name === 'Jaune' ? 'text-black' : 'text-white'} />
                                              )}
                                          </button>
                                      ))}
                                  </div>
                                  <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-2">
                                    Couleur choisie: <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{v.colorName}</span>
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Stock pour cette couleur</label>
                                      <input 
                                        type="number" 
                                        placeholder="0" 
                                        value={v.stockQuantity} 
                                        onChange={e => handleVariantChange(i, 'stockQuantity', e.target.value)} 
                                        className="input-field text-sm py-2"
                                        min="0"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Photos (Face/Dos)</label>
                                      <input 
                                          type="file" multiple 
                                          onChange={e => handleVariantFileChange(i, e)} 
                                          className="text-xs w-full text-slate-500 cursor-pointer file-theme"
                                      />
                                  </div>
                              </div>
                          </div>
                          {variants.length > 1 && (
                              <button 
                                  type="button" 
                                  onClick={() => removeVariant(i)} 
                                  className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-md border border-slate-200 hover:bg-red-50 transition-colors"
                                  title="Retirer cette variante"
                              >
                                  <XCircle size={18}/>
                              </button>
                          )}
                      </div>
                  ))}
                </div>
              )}

              {/* Navigation Stepper & Soumission Fixe en Bas */}
              <div className="pt-4 pb-2 sticky bottom-0 bg-white z-10 border-t border-slate-100 mt-4 flex items-center justify-between gap-3">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1) as any : 1))}
                      disabled={isSubmitting}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} /> Précédent
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="px-5 py-3 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Annuler
                    </button>
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => (prev < 3 ? (prev + 1) as any : 3))}
                      className="px-6 py-3 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                      Suivant <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                        className="px-8 py-3.5 text-white font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>{editingId ? 'Sauvegarder' : 'Créer le produit'}</span>
                        </>
                      )}
                    </button>
                  )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 🛡️ MODALE DE CONFIRMATION DESTRUCTICE À DOUBLE ÉTAPE */}
      <ConfirmDestructiveModal
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le produit"
        message="Êtes-vous certain de vouloir supprimer définitivement ce produit du catalogue ? Cette action est irréversible et supprimera également toutes les variantes associées."
        itemName={deleteProductTarget?.name}
        isLoading={isDeleting}
        requireTyping={true}
        confirmWord="SUPPRIMER"
      />

      {/* 🪄 STYLE MAGIQUE POUR LES INPUTS ET BOUTONS FICHIER */}
      <style>{`
        .input-field {
            width: 100%;
            padding: 12px 16px;
            background-color: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            outline: none;
            transition: all 0.2s;
        }
        .input-field:focus {
            border-color: var(--theme-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 15%, transparent);
        }
        
        /* Personnalisation du bouton "Choisir un fichier" */
        .file-theme::file-selector-button {
            margin-right: 16px;
            padding: 8px 16px;
            border-radius: 9999px;
            border: none;
            font-size: 12px;
            font-weight: 600;
            background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent);
            color: var(--theme-primary);
            cursor: pointer;
            transition: all 0.2s;
        }
        .file-theme::file-selector-button:hover {
            background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);
        }

        /* Scrollbar personnalisée pour la modale */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f8fafc;
            border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
      `}</style>
    </div>
  );
};