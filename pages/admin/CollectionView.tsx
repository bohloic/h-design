import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, XCircle, Search, Calendar, Image as ImageIcon, Layers, Check } from 'lucide-react';
import { authFetch } from '../../src/utils/apiClient';

export const CollectionView = () => {
    const [collections, setCollections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_active: false,
        primary_color: '#ff0000',
        banner_url: ''
    });

    // --- LECTURE ---
    const fetchCollections = async () => {
        try {
            setLoading(true);
            const res = await authFetch('/api/collections');
            const data = await res.json();
            setCollections(data);
        } catch (error) {
            console.error("Erreur fetch", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    // --- GESTION FORMULAIRE ---
    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditClick = (col: any) => {
        setEditingId(col.id);
        const startDate = col.start_date ? col.start_date.split('T')[0] : '';
        const endDate = col.end_date ? col.end_date.split('T')[0] : '';

        let config = col.ui_config;
        if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch(e) {}
        }

        setFormData({
            name: col.name,
            start_date: startDate,
            end_date: endDate,
            is_active: Boolean(col.is_active),
            primary_color: config?.primary_color || '#ff0000',
            banner_url: config?.banner_url || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', start_date: '', end_date: '', is_active: false, primary_color: '#ff0000', banner_url: '' });
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active,
            ui_config: {
                primary_color: formData.primary_color,
                banner_url: formData.banner_url
            }
        };

        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/api/collections/${editingId}` : '/api/collections';

        try {
            const res = await authFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(editingId ? "Collection modifiée !" : "Collection créée !");
                resetForm();
                fetchCollections();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Supprimer cette collection ?")) return;
        await authFetch(`/api/collections/${id}`, { method: 'DELETE' });
        fetchCollections();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            
            {/* EN-TÊTE RESPONSIVE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-red-100 p-2 rounded-lg text-red-600">
                            <Layers size={24} />
                        </span>
                        Collections
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Gérez les thèmes saisonniers (Noël, Été...).</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                    <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Collection</span><span className="sm:hidden">Ajouter</span>
                </button>
            </div>

            {/* CONTENU : TABLEAU OU LISTE */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Chargement...</div>
                ) : collections.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>Aucune collection trouvée.</p>
                    </div>
                ) : (
                    <>
                        {/* --- TABLEAU DESKTOP --- */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Nom</th>
                                        <th className="px-6 py-4">Période</th>
                                        <th className="px-6 py-4">Design</th>
                                        <th className="px-6 py-4">Statut</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {collections.map((col: any) => {
                                        const config = typeof col.ui_config === 'string' ? JSON.parse(col.ui_config) : col.ui_config;
                                        return (
                                            <tr key={col.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-700">{col.name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(col.start_date)}</span>
                                                        <span className="flex items-center gap-1 ml-4 text-slate-400">au {formatDate(col.end_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div 
                                                        className="w-8 h-8 rounded-lg border shadow-sm" 
                                                        style={{ backgroundColor: config?.primary_color || '#ccc' }}
                                                        title="Couleur du thème"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {col.is_active ? (
                                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Actif</span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Inactif</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditClick(col)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Edit size={18}/></button>
                                                        <button onClick={() => handleDelete(col.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* --- LISTE MOBILE --- */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {collections.map((col: any) => {
                                const config = typeof col.ui_config === 'string' ? JSON.parse(col.ui_config) : col.ui_config;
                                return (
                                    <div key={col.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0" 
                                                    style={{ backgroundColor: config?.primary_color || '#ccc' }}
                                                />
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{col.name}</h4>
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        <Calendar size={12} /> {formatDate(col.start_date)} - {formatDate(col.end_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            {col.is_active ? (
                                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm" title="Actif"></span>
                                            ) : (
                                                <span className="w-3 h-3 rounded-full bg-slate-300" title="Inactif"></span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleEditClick(col)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2">
                                                <Edit size={16} /> Modifier
                                            </button>
                                            <button onClick={() => handleDelete(col.id)} className="flex-1 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2">
                                                <Trash2 size={16} /> Supprimer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* --- MODAL RESPONSIVE --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] overflow-y-auto">
                        
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {editingId ? <Edit size={20} className="text-red-600"/> : <Plus size={20} className="text-red-600"/>}
                                {editingId ? 'Modifier' : 'Nouvelle Collection'}
                            </h3>
                            <button onClick={resetForm} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nom de la collection</label>
                                <input 
                                    type="text" name="name" required
                                    value={formData.name} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none font-medium placeholder-slate-400"
                                    placeholder="Ex: Noël 2025"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Date de début</label>
                                    <input 
                                        type="date" name="start_date" required
                                        value={formData.start_date} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Date de fin</label>
                                    <input 
                                        type="date" name="end_date" required
                                        value={formData.end_date} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-red-600 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <ImageIcon size={16} /> Apparence
                                </p>
                                
                                <div className="flex items-center gap-4">
                                    <label className="text-sm text-slate-600">Couleur principale :</label>
                                    <input 
                                        type="color" name="primary_color"
                                        value={formData.primary_color} onChange={handleChange}
                                        className="h-10 w-20 cursor-pointer rounded border border-slate-300 p-1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-600">Lien bannière (URL) :</label>
                                    <input 
                                        type="text" name="banner_url"
                                        value={formData.banner_url} onChange={handleChange}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-600"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" name="is_active"
                                        checked={formData.is_active} onChange={handleChange}
                                        className="w-5 h-5 text-red-600 rounded focus:ring-red-600 border-gray-300"
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Activer cette collection immédiatement</span>
                            </label>

                            <button type="submit" className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 active:scale-95">
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