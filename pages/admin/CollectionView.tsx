import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, XCircle, Search, Calendar, Image as ImageIcon, Layers, Check, AlertCircle } from 'lucide-react';
import { authFetch } from '../../src/utils/apiClient';

export const CollectionView = () => {
    const [collections, setCollections] = useState<any[]>([]);
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

    // Vérifie si une AUTRE collection est déjà active
    const activeCollection = collections.find(c => c.is_active && c.id !== editingId);

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
        
        // Avertissement de sécurité
        if (formData.is_active && activeCollection) {
            if(!confirm(`Attention, la collection "${activeCollection.name}" est déjà active. Si vous continuez, elle sera désactivée au profit de celle-ci. Continuer ?`)) {
                return;
            }
        }

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
                resetForm();
                fetchCollections();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Supprimer cette collection ? Tous les produits qui y sont liés la perdront.")) return;
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
                        <span 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
                        >
                            <Layers size={24} />
                        </span>
                        Thèmes & Collections
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Personnalisez le design du site selon les saisons (Noël, Été...).</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    className="w-full sm:w-auto text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-95 hover:opacity-100 transition-opacity shadow-lg active:scale-95"
                >
                    <Plus size={20} /> <span className="hidden sm:inline">Nouveau Thème</span><span className="sm:hidden">Ajouter</span>
                </button>
            </div>

            {/* CONTENU : TABLEAU OU LISTE */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <div 
                            className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-4"
                            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', borderTopColor: 'var(--theme-primary)' }}
                        ></div>
                        Chargement...
                    </div>
                ) : collections.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>Aucun thème saisonnier configuré.</p>
                    </div>
                ) : (
                    <>
                        {/* --- TABLEAU DESKTOP --- */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Nom du Thème</th>
                                        <th className="px-6 py-4">Période</th>
                                        <th className="px-6 py-4">Couleur Principale</th>
                                        <th className="px-6 py-4">Bannière</th>
                                        <th className="px-6 py-4">Statut</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {collections.map((col: any) => {
                                        const config = typeof col.ui_config === 'string' ? JSON.parse(col.ui_config) : col.ui_config;
                                        return (
                                            <tr key={col.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-700">
                                                    {col.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(col.start_date)}</span>
                                                        <span className="flex items-center gap-1 ml-4 text-slate-400">au {formatDate(col.end_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-6 h-6 rounded-full border shadow-sm" 
                                                            style={{ backgroundColor: config?.primary_color || '#ccc' }}
                                                        />
                                                        <span className="text-xs font-mono text-slate-500">{config?.primary_color || 'Défaut'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {config?.banner_url ? (
                                                        <a href={config.banner_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm flex items-center gap-1">
                                                            <ImageIcon size={14} /> Voir image
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm italic">Aucune</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {col.is_active ? (
                                                        <span 
                                                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse"
                                                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
                                                        >
                                                            Site Actif
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Inactif</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditClick(col)} className="p-2 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"><Edit size={18}/></button>
                                                        <button 
                                                            onClick={() => handleDelete(col.id)} 
                                                            className="p-2 text-slate-400 bg-white rounded-lg transition-all border border-transparent hover:border-red-100 hover:bg-red-50"
                                                            style={{ color: 'var(--theme-primary)' }} // Utilise la couleur du thème (qui est souvent un rouge par défaut pour la suppression)
                                                        >
                                                            <Trash2 size={18}/>
                                                        </button>
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
                                                <span 
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
                                                >
                                                    Site Actif
                                                </span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Inactif</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleEditClick(col)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2">
                                                <Edit size={16} /> Modifier
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(col.id)} 
                                                className="flex-1 py-2 text-sm font-bold bg-white border rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
                                                style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                                            >
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
                                {editingId ? <Edit size={20} style={{ color: 'var(--theme-primary)' }}/> : <Plus size={20} style={{ color: 'var(--theme-primary)' }}/>}
                                {editingId ? 'Modifier le Thème' : 'Nouveau Thème'}
                            </h3>
                            <button onClick={resetForm} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nom du thème (Ex: Collection de Noël)</label>
                                <input 
                                    type="text" name="name" required
                                    value={formData.name} onChange={handleChange}
                                    style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none font-medium placeholder-slate-400 transition-all focus:bg-white focus:ring-2"
                                    placeholder="Ex: Noël 2025"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Date de début</label>
                                    <input 
                                        type="date" name="start_date" required
                                        value={formData.start_date} onChange={handleChange}
                                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none transition-all focus:bg-white focus:ring-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Date de fin</label>
                                    <input 
                                        type="date" name="end_date" required
                                        value={formData.end_date} onChange={handleChange}
                                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl outline-none transition-all focus:bg-white focus:ring-2"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <ImageIcon size={16} /> Apparence du site
                                </p>
                                
                                <div className="flex items-center gap-4">
                                    <label className="text-sm text-slate-600 flex-1">Couleur des boutons et textes majeurs :</label>
                                    <input 
                                        type="color" name="primary_color"
                                        value={formData.primary_color} onChange={handleChange}
                                        className="h-10 w-20 cursor-pointer rounded border border-slate-300 p-1 bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-600">Lien de la bannière (Affichée en haut du site) :</label>
                                    <input 
                                        type="text" name="banner_url"
                                        value={formData.banner_url} onChange={handleChange}
                                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all focus:ring-2"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <label 
                                className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.is_active ? 'bg-slate-50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                style={formData.is_active ? { borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' } : {}}
                            >
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" name="is_active"
                                        checked={formData.is_active} onChange={handleChange}
                                        style={{ 
                                            accentColor: 'var(--theme-primary)' // Note : accentColor est supporté par beaucoup de navigateurs modernes pour les checkbox
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-slate-700 block">Appliquer ce thème au site</span>
                                    {formData.is_active && activeCollection && (
                                        <span className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--theme-primary)' }}>
                                            <AlertCircle size={12} /> Attention, cela désactivera "{activeCollection.name}"
                                        </span>
                                    )}
                                </div>
                            </label>

                            <button 
                                type="submit" 
                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                className="w-full py-4 text-white font-bold rounded-xl opacity-95 hover:opacity-100 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Check size={20} />
                                {editingId ? 'Mettre à jour le site' : 'Créer et appliquer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};