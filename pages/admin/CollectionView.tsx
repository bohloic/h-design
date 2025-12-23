import React, { useState, useEffect } from 'react';

export const CollectionView = () => {
    const [collections, setCollections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Initialisation du formulaire
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_active: false,
        // Champs "virtuels" pour le JSON
        primary_color: '#ff0000', // couleur par défaut
        banner_url: ''
    });

    // 1. Charger les données
    const fetchCollections = async () => {
        try {
            const res = await fetch('http://localhost:205/api/collections');
            const data = await res.json();
            setCollections(data);
        } catch (error) {
            console.error("Erreur fetch", error);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    // 2. Gestion des inputs
    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // 3. Préparer l'édition (Extraire le JSON)
    const handleEditClick = (col: any) => {
        setEditingId(col.id);
        
        // Attention : SQL renvoie les dates en format long (ISO), il faut couper pour l'input date (YYYY-MM-DD)
        const startDate = col.start_date ? col.start_date.split('T')[0] : '';
        const endDate = col.end_date ? col.end_date.split('T')[0] : '';

        // Si ui_config est une string JSON (parfois le cas avec MySQL), on parse. Sinon c'est déjà un objet.
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

    // 4. Sauvegarde (Reconstruire le JSON)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // On regroupe couleur et image dans l'objet ui_config
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
        const url = editingId 
            ? `http://localhost:205/api/collections/${editingId}`
            : 'http://localhost:205/api/collections';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Sauvegardé !");
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({ name: '', start_date: '', end_date: '', is_active: false, primary_color: '#ff0000', banner_url: '' });
                fetchCollections(); // Recharger la liste
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 5. Suppression
    const handleDelete = async (id: number) => {
        if(!confirm("Supprimer cette collection ?")) return;
        await fetch(`http://localhost:205/api/collections/${id}`, { method: 'DELETE' });
        fetchCollections();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des Collections</h1>
                <button 
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', start_date: '', end_date: '', is_active: false, primary_color: '#ff0000', banner_url: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    + Nouvelle Collection
                </button>
            </div>

            {/* TABLEAU */}
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="text-left p-4">Nom</th>
                            <th className="text-left p-4">Dates</th>
                            <th className="text-left p-4">Config (Aperçu)</th>
                            <th className="text-left p-4">Statut</th>
                            <th className="text-right p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {collections.map((col: any) => {
                            // Petit parse rapide pour l'affichage de la couleur
                            const config = typeof col.ui_config === 'string' ? JSON.parse(col.ui_config) : col.ui_config;
                            
                            return (
                                <tr key={col.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{col.name}</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        Du {new Date(col.start_date).toLocaleDateString()} <br/>
                                        Au {new Date(col.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {/* Carré de couleur */}
                                            <div 
                                                className="w-6 h-6 rounded border" 
                                                style={{ backgroundColor: config?.primary_color || '#ccc' }}
                                                title="Couleur du thème"
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {col.is_active ? (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Actif</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Inactif</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleEditClick(col)} className="text-blue-600 mr-3">Éditer</button>
                                        <button onClick={() => handleDelete(col.id)} className="text-red-600">Supprimer</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORMULAIRE */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px] shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{editingId ? "Modifier" : "Créer"} une Collection</h2>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            
                            {/* Nom */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Nom de la collection</label>
                                <input 
                                    type="text" name="name" required
                                    value={formData.name} onChange={handleChange}
                                    className="border p-2 rounded w-full"
                                    placeholder="Ex: Noël 2025"
                                />
                            </div>

                            {/* Dates (cote à cote) */}
                            <div className="flex gap-2">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium mb-1">Début</label>
                                    <input 
                                        type="date" name="start_date" required
                                        value={formData.start_date} onChange={handleChange}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium mb-1">Fin</label>
                                    <input 
                                        type="date" name="end_date" required
                                        value={formData.end_date} onChange={handleChange}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>
                            </div>

                            {/* Section Design (UI Config) */}
                            <div className="border p-3 rounded bg-gray-50">
                                <p className="text-sm font-bold mb-2 text-gray-700">Design du thème</p>
                                
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="text-sm">Couleur principale :</label>
                                    <input 
                                        type="color" name="primary_color"
                                        value={formData.primary_color} onChange={handleChange}
                                        className="h-8 w-16 cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm block mb-1">Lien bannière (Image URL) :</label>
                                    <input 
                                        type="text" name="banner_url"
                                        value={formData.banner_url} onChange={handleChange}
                                        className="border p-2 rounded w-full text-sm"
                                        placeholder="http://..."
                                    />
                                </div>
                            </div>

                            {/* Checkbox Actif */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" name="is_active"
                                    checked={formData.is_active} onChange={handleChange}
                                    className="w-5 h-5 text-purple-600"
                                />
                                <span className="text-sm font-medium">Activer cette collection immédiatement</span>
                            </label>

                            {/* Boutons */}
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 px-3">Annuler</button>
                                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};