import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, XCircle, Tag, Check, Calendar, Search, LayoutGrid } from 'lucide-react';
import { authFetch } from '../../src/utils/apiClient';

interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export const CategoryView = () => {
  // --- ÉTATS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: ''
  });

  // --- LECTURE ---
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map((item: any) => ({
            id: item.id,
            name: item.nom || item.name,
            created_at: item.created_at
        }));
        setCategories(formattedData);
      }
    } catch (error) {
      console.error("Erreur chargement catégories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- GESTION FORMULAIRE ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '' });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = { name: formData.name };

    try {
        let response;
        const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
        const method = editingId ? 'PUT' : 'POST';

        response = await authFetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            fetchCategories();
            resetForm();
        } else {
            const errorData = await response.json();
            alert("Erreur : " + (errorData.message || "Impossible d'enregistrer"));
        }
    } catch (error) {
        console.error(error);
        alert("Erreur technique");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    const token = localStorage.getItem('token');

    try {
        const response = await authFetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            setCategories(prev => prev.filter(c => c.id !== id));
        } else {
            alert("Impossible de supprimer.");
        }
    } catch (error) {
        console.error(error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      {/* En-tête Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span 
                className="p-2 rounded-lg"
                // 🪄 FOND AVEC TRANSPARENCE ET COULEUR DU THEME
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
            >
                <LayoutGrid size={24} />
            </span>
            Catégories
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez les types de produits (Robes, etc.).</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ backgroundColor: 'var(--theme-primary)' }}
          className="w-full sm:w-auto text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-95 hover:opacity-100 transition-opacity shadow-lg active:scale-95"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Catégorie</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Contenu : Liste ou Tableau */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
             <div 
                className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-4"
                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', borderTopColor: 'var(--theme-primary)' }}
             ></div>
             Chargement...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Aucune catégorie trouvée.</p>
          </div>
        ) : (
          <>
            {/* --- TABLEAU DESKTOP --- */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                    <th className="px-6 py-4 w-20"># ID</th>
                    <th className="px-6 py-4">Nom</th>
                    <th className="px-6 py-4">Date création</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                            {cat.id}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg border"
                                    style={{ 
                                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', 
                                        color: 'var(--theme-primary)',
                                        borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                                    }}
                                >
                                    {cat.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-700">{cat.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {formatDate(cat.created_at)}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(cat)} className="p-2 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200" title="Modifier">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100" title="Supprimer">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* --- LISTE MOBILE --- */}
            <div className="md:hidden divide-y divide-slate-100">
                {categories.map(cat => (
                    <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl border shadow-sm flex-shrink-0"
                                style={{ 
                                    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', 
                                    color: 'var(--theme-primary)',
                                    borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                                }}
                            >
                                {cat.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg leading-tight">{cat.name}</h4>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar size={12} /> {formatDate(cat.created_at)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-1">
                            <button 
                                onClick={() => handleEditClick(cat)}
                                className="p-3 text-slate-400 bg-white border border-slate-100 rounded-xl hover:text-slate-900 active:scale-95 shadow-sm"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(cat.id)}
                                className="p-3 text-red-400 bg-red-50 border border-red-100 rounded-xl hover:text-red-600 active:scale-95 shadow-sm"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* --- MODAL RESPONSIVE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId 
                    ? <Edit size={20} style={{ color: 'var(--theme-primary)' }}/> 
                    : <Plus size={20} style={{ color: 'var(--theme-primary)' }}/>
                }
                {editingId ? 'Modifier' : 'Nouvelle Catégorie'}
              </h3>
              <button onClick={resetForm} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nom de la catégorie</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    required 
                    onChange={handleChange} 
                    style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-medium text-lg placeholder-slate-400 transition-all focus:bg-white focus:ring-2" 
                    placeholder="Ex: Robes" 
                    autoFocus
                  />
              </div>

              <button 
                type="submit" 
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="w-full py-4 text-white font-bold rounded-xl opacity-95 hover:opacity-100 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <Check size={20} />
                {editingId ? 'Sauvegarder' : 'Créer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};