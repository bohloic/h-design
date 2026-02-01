import React, { useState, useEffect } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { Edit, Plus, Trash2, XCircle, Tag, Layers, Check, Image as ImageIcon, Search, Palette, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

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

export const ProductView = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const [variants, setVariants] = useState([
    { colorName: TEXTILE_COLORS[0].name, colorCode: TEXTILE_COLORS[0].hex, stockQuantity: 0, files: [] }
  ]);
  
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'unisexe',
    collection_id: '',
    category_id: '',
    price: '',
    description: '',
    stock_quantity: 0,
    image_url: '',
    color: 'Blanc'
  });

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
      
      setProducts(await productsRes.json());
      setCollections(await collectionsRes.json());
      setCategories(await categoriesRes.json());
    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          // @ts-ignore
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
      setFormData({ 
        name: '', category: 'unisexe', collection_id: '', category_id: '', price: '', description: '', stock_quantity: 0, image_url: '',
        color: 'Blanc' 
      });
      setSelectedSizes([]);
      setSelectedFile(null);
      setVariants([{ colorName: TEXTILE_COLORS[0].name, colorCode: TEXTILE_COLORS[0].hex, stockQuantity: 0, files: [] }]);
      setIsModalOpen(false);
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    
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
    const token = localStorage.getItem('token');

    try {
        let mainImageBase64 = null;
        if (selectedFile) {
            mainImageBase64 = await fileToBase64(selectedFile);
        }

        const variantsWithBase64 = await Promise.all(variants.map(async (v) => {
            // @ts-ignore
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
            alert(editingId ? "Produit mis à jour !" : "Produit créé !");
            fetchData();
            resetForm();
        } else {
            const errorData = await response.json();
            alert("Erreur Backend : " + (errorData.message || errorData.error));
        }

    } catch (error: any) {
        console.error("ERREUR:", error);
        alert("Erreur technique : " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr ?")) return;
    const token = localStorage.getItem('token');
    try {
        const response = await authFetch(`/api/products/delete-product/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setProducts(prev => prev.filter((p:any) => p.id !== id));
        else alert("Impossible de supprimer.");
    } catch (error) { console.error(error); }
  };

  return (
    // ✅ CORRECTION MAJEURE ICI : Ajout de 'overflow-x-hidden' et 'max-w-full' pour empêcher le scroll horizontal
    <div className="p-4 md:p-8 space-y-6 w-full max-w-[100vw] overflow-x-hidden">
      
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm w-full">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span className="bg-red-100 p-2 rounded-lg text-red-600">
                <Tag size={24} />
             </span>
             Inventaire
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez vos articles, tailles et stocks.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Nouveau Produit</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* --- LISTE DES PRODUITS --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
        {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-4"></div>
                Chargement...
            </div>
        ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Aucun produit trouvé.</p>
            </div>
        ) : (
            <>
                {/* 1. VUE TABLEAU (DESKTOP SEULEMENT) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                        <th className="px-6 py-4">Produit</th>
                        <th className="px-6 py-4">Couleur</th>
                        <th className="px-6 py-4">Catégorie</th>
                        <th className="px-6 py-4">Prix</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map((product: any) => (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                        <img src={BASE_IMG_URL + product.image_url} alt="" className="w-full h-full object-cover" />
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
                            <td className="px-6 py-4 font-bold text-slate-900">{product.price} FCFA</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock_quantity}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(product)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* 2. VUE CARTES (MOBILE SEULEMENT - Alignement fixé) */}
                <div className="md:hidden divide-y divide-slate-100 bg-slate-50/50 w-full">
                    {products.map((product: any) => (
                        <div key={product.id} className="p-4 bg-white mb-2 shadow-sm first:mt-0 last:mb-0 w-full">
                             
                             {/* En-tête Carte */}
                             <div className="flex justify-between items-start mb-3">
                                {/* 'min-w-0' est crucial pour empêcher le flex de déborder */}
                                <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                                    <div className="w-12 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                        <img src={BASE_IMG_URL + product.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Produit</span>
                                        {/* truncate est important ici */}
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
                                    <span className="font-black text-slate-900">{product.price} FCFA</span>
                                </div>
                             </div>

                             {/* Actions Carte */}
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditClick(product)} 
                                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:border-red-300 hover:text-red-600 transition-colors shadow-sm"
                                >
                                    <Edit size={16}/> Modifier
                                </button>
                                <button 
                                    onClick={() => handleDelete(product.id)} 
                                    className="flex-1 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-red-100 transition-colors shadow-sm"
                                >
                                    <Trash2 size={16}/> Supprimer
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>

      {/* --- MODAL FORMULAIRE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {editingId ? <Edit size={20} className="text-red-600"/> : <Plus size={20} className="text-red-600"/>}
                  {editingId ? 'Modifier' : 'Nouveau Produit'}
              </h3>
              <button onClick={resetForm} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                  <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nom du produit</label>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="T-shirt Vintage..." className="input-field" required/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prix (FCFA)</label>
                    <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="5000" className="input-field" required/>
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description détaillée..." className="input-field h-20 resize-none" required/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stock Global</label>
                    <input name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} className="input-field" required/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Genre / Cible</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {['homme', 'femme', 'enfant', 'unisexe'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, category: cat}))}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                                    formData.category === cat ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Collection</label>
                    <select name="collection_id" onChange={handleChange} value={formData.collection_id} required className="input-field appearance-none">
                        <option value="">Choisir...</option>
                        {collections.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Coupe (Catégorie)</label>
                    <select name="category_id" onChange={handleChange} value={formData.category_id} required className="input-field appearance-none">
                        <option value="">Choisir...</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <Layers size={14}/> Tailles disponibles
                  </label>
                  <div className="flex flex-wrap gap-2">
                      {AVAILABLE_SIZES.map(size => (
                          <button
                              type="button"
                              key={size}
                              onClick={() => toggleSize(size)}
                              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border ${
                                  selectedSizes.includes(size) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'
                              }`}
                          >
                              {size}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                          <ImageIcon size={14}/> Image Principale
                      </label>
                      <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="input-field text-sm" accept="image/*"/>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                          Couleur affichée (Produit principal)
                      </label>
                      <div className="flex flex-wrap gap-2">
                          {TEXTILE_COLORS.map((color) => (
                              <button
                                  key={color.name}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                                      formData.color === color.name 
                                      ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-sm' 
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                  }`}
                              >
                                  <div className={`w-3 h-3 rounded-full border border-black/10`} style={{ backgroundColor: color.hex }}></div>
                                  {color.name}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2"><Palette size={18}/> Variantes (Autres Couleurs)</h4>
                      <button type="button" onClick={addVariant} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">+ Ajouter variante</button>
                  </div>
                  
                  {variants.map((v, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative animate-in fade-in slide-in-from-bottom-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Couleur de la variante</label>
                                  <div className="flex flex-wrap gap-2">
                                      {TEXTILE_COLORS.map((color) => (
                                          <button
                                              key={color.name}
                                              type="button"
                                              onClick={() => setVariantColor(i, color)}
                                              title={color.name}
                                              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110 ${
                                                  v.colorName === color.name 
                                                  ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 border-slate-900' 
                                                  : 'border-slate-300'
                                              }`}
                                              style={{ backgroundColor: color.hex }}
                                          >
                                              {v.colorName === color.name && (
                                                  <Check size={14} className={color.name === 'Blanc' || color.name === 'Jaune' ? 'text-black' : 'text-white'} />
                                              )}
                                          </button>
                                      ))}
                                  </div>
                                  <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-2">
                                    Sélectionné: <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{v.colorName}</span>
                                  </div>
                              </div>
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Stock pour cette couleur</label>
                                      <input 
                                        type="number" 
                                        placeholder="0" 
                                        value={v.stockQuantity} 
                                        onChange={e => handleVariantChange(i, 'stockQuantity', e.target.value)} 
                                        className="input-field text-sm py-2"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Images (Face/Dos)</label>
                                      <input type="file" multiple onChange={e => handleVariantFileChange(i, e)} className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                                  </div>
                              </div>
                          </div>
                          {variants.length > 1 && (
                              <button type="button" onClick={() => removeVariant(i)} className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-md border border-slate-200 hover:bg-red-50 transition-colors"><XCircle size={18}/></button>
                          )}
                      </div>
                  ))}
              </div>

              <button type="submit" className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 active:scale-95">
                <Check size={20} />
                {editingId ? 'Sauvegarder les modifications' : 'Créer le produit'}
              </button>
            </form>
          </div>
        </div>
      )}

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
            border-color: #dc2626;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
        }
      `}</style>
    </div>
  );
};