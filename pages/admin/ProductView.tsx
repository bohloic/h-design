import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, XCircle } from 'lucide-react';

export const ProductView = () => {
  //  On prépare une boite vide (State) pour recevoir l'objet plus tard
  const [products, setProducts] = useState([]);
  
  const [collections, setCollections] = useState([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // null = mode création,  string/number = mode édition
  const [editingId, setEditingId] = useState<string | null>(null);

  // Ajoutez les états
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      collection_id: '',
      price: '',
      description: '',
      stock_quantity: 0,
      image_url: ''
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:205/api/products/get-product');
      const data = await response.json(); // On attend la conversion en objet
      
      // 3. On met l'objet dans la boite
      setProducts(data); 
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCollections = async () => {
      try {
          const res = await fetch('http://localhost:205/api/collections');
          const data = await res.json();
          setCollections(data);
      } catch (error) {
          console.error("Erreur fetch", error);
      }
  }; 

  //  Fonction pour gérer les changements dans les inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
  };  

  const handleEditClick = (product: any ) => {
      // 1. On garde l'ID en mémoire pour savoir qu'on modifie celui-là
      setEditingId(product.id);

      // 2. On remplit le formulaire avec les données existantes
      setFormData({
          name: product.name,
          price: product.price,
          collection_id: product.collection_id,
          description: product.description || '', // || '' évite les erreurs si null
          stock_quantity: product.stock_quantity,
          image_url: product.image_url || ''
      });

      // 3. On ouvre le modal
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. On crée un objet FormData (obligatoire pour les fichiers)
    const dataToSend = new FormData();

    // 2. On ajoute les champs texte
    dataToSend.append('name', formData.name);
    dataToSend.append('description', formData.description);
    dataToSend.append('collection_id', formData.collection_id);
    dataToSend.append('price', formData.price); // FormData envoie tout en string, le backend gérera
    dataToSend.append('stock_quantity', formData.stock_quantity.toString());

    // 3. On ajoute le fichier SI il y en a un
    if (selectedFile) {
        // 'image' doit correspondre au nom dans upload.single('image') du backend
        dataToSend.append('image', selectedFile); 
    }

    try {
        // 4. On envoie (Note : PAS de Header 'Content-Type': 'application/json')
        // Fetch détectera automatiquement le FormData
        let response;
        
        // 1. Vérification : Mode ÉDITION ou CRÉATION ?
        if (editingId) {
            // === MODIFICATION (PUT) ===
            // ⚠️ On utilise le port 3000
            // ⚠️ On utilise l'URL standard REST (pas de /update-product)
            response = await fetch(`http://localhost:205/api/products/update-product/${editingId}`, {
                method: 'PUT', // Important : PUT pour modifier
                body: dataToSend, 
            });
        } else {
            // === CRÉATION (POST) ===
            response = await fetch('http://localhost:205/api/products/create-product', {
                method: 'POST', // Important : POST pour créer
                body: dataToSend,
            });
        }

        if (response.ok) {
            alert(editingId ? "Produit modifié !" : "Produit créé !");
            setIsModalOpen(false);
            window.location.reload();
        } else {
            const errorData = await response.json();
            alert("Erreur : " + errorData.message);
        }
    } catch (error) {
        console.error(error);
    }
  };


  useEffect(() => {
    fetchUsers(); // On lance l'appel    
    fetchCollections();
  }, []);


  const handleDelete = async (id: number) => {
    // 1. Sécurité : On demande confirmation à l'utilisateur
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.")) {
        return; // Si l'utilisateur clique sur "Annuler", on s'arrête là.
    }

    try {
        // 2. Appel au Backend
        const response = await fetch(`http://localhost:205/api/products/delete-product/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            // 3. Option A (Facile) : On recharge la page pour voir la liste à jour
            // window.location.reload();

            // 3. Option B (Pro & Rapide) : On met à jour la liste localement sans recharger la page
            // On garde tous les produits SAUF celui qu'on vient de supprimer
            setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
            
            alert("Produit supprimé !");
        } else {
            // Si le backend renvoie une erreur (ex: produit lié à une commande)
            const errorData = await response.json();
            alert("Erreur : " + (errorData.message || "Impossible de supprimer"));
        }

    } catch (error) {
        console.error("Erreur suppression :", error);
        alert("Erreur de connexion au serveur.");
    }
  };

  const col= (p) => {
    const pap = collections.find((collect) => collect.id === p.collection_id)
    return pap.name  
    
  
  }


  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Gestion de l'Inventaire</h3>
          <p className="text-slate-500">Ajoutez, modifiez ou supprimez vos articles de mode.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Nouveau Produit
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold">
              <th className="px-6 py-4">Produit</th>
              <th className="px-6 py-4">Collection</th>
              <th className="px-6 py-4">Prix</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* <pre>{JSON.stringify(prod)} </pre> */}
            {products.map(product => {
              // On cherche la collection correspondante
              const collection = collections.find(c => c.id === product.collection_id);
              return (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={product.image_url} className="w-12 h-16 rounded-lg object-cover" alt={product.name} />
                      <span className="font-semibold text-slate-700">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      {collection ? collection.name : 'Aucune'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{Number(product.price || 0).toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.stock_quantity < 10 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <span className={product.stock_quantity < 10 ? 'text-rose-600 font-bold' : ''}>{product.stock_quantity} en stock</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { handleEditClick(product); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? 'Modifier le Produit' : 'Ajouter un Produit'}</h3>
              <button onClick={() => {setEditingId(null); setFormData({ name: '', price: '',collection_id: '', description: '', stock_quantity: 0, image_url: '' }); setIsModalOpen(false); }} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                          {/* <form  className="p-8 space-y-6"> */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nom du produit</label>
                <input name="name" value={formData?.name} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Description du produit</label>
                <textarea name="description" value={formData?.description} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Collections</label>
                  <select name="collection_id" onChange={handleChange} value={formData?.collection_id} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Sélectionner...</option>
                    {collections.map((collect, index) => (
                      <option key={`${collect.name}-${index}`} value={collect.id}>{collect.name} </option>
                    ))}
                    
                    
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Prix (€)</label>
                  <input name="price" type="number" step="0.01" value={formData?.price} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Stock initial</label>
                  <input name="stock_quantity" type="number" value={formData?.stock_quantity} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Image du produit</label>
                  <input name="image_url" type="file" accept="image/*"  onChange={(e) => { if(e.target.files && e.target.files[0]){ setSelectedFile(e.target.files[0]); } }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              
              <button type="submit" onClick={() => (console.log(formData))} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"  >
                {editingId ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};