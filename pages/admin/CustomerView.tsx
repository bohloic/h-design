import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash2, UserPlus, Gift, Mail, Search, XCircle, Check } from 'lucide-react';

export const CustomerView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [showModal, setShowModal] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    loyalty_points: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
        setLoading(false);
    }
  }; 

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setFormData({ nom: '', prenom: '', email: '', password: '', loyalty_points: 0 });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      password: '', 
      loyalty_points: user.loyalty_points
    });
    setCurrentId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/users/${currentId}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      fetchUsers();
      closeModal();
    } catch (error) {
      alert("Erreur lors de l'opération");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer définitivement cet utilisateur ?")) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error("Erreur suppression", error);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      {/* En-tête Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-red-100 p-2 rounded-lg text-red-600">
                <UserPlus size={24} />
            </span>
            Gestion des Utilisateurs
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez vos clients et leur fidélité.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
        >
          <UserPlus size={20} /> <span className="hidden sm:inline">Ajouter un membre</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Contenu : Grille Responsive */}
      {loading ? (
          <div className="p-12 text-center text-slate-400">Chargement...</div>
      ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aucun utilisateur trouvé.</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map((user: any) => (
              <div key={user.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                
                {/* Header Carte */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg border border-slate-200">
                            {user.prenom ? user.prenom.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">
                                {user.prenom} {user.nom}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <Mail size={12} /> {user.email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges & Stats */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fidélité</span>
                    <span className="flex items-center gap-1 text-red-600 font-black">
                        <Gift size={16} /> {user.loyalty_points} pts
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button 
                        onClick={() => openEditModal(user)}
                        className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Edit size={16} /> Modifier
                    </button>
                    <button 
                        onClick={() => handleDelete(user.id)}
                        className="flex-1 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

              </div>
            ))}
          </div>
      )}

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {isEditing ? 'Modifier le profil' : 'Nouveau membre'}
              </h3>
              <button onClick={closeModal} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Prénom</label>
                      <input className="input-field" type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Nom</label>
                      <input className="input-field" type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Email</label>
                  <input className="input-field" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              {!isEditing && (
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Mot de passe</label>
                      <input className="input-field" type="password" name="password" value={formData.password} onChange={handleChange} required />
                  </div>
              )}

              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Points Fidélité</label>
                  <input className="input-field" type="number" name="loyalty_points" value={formData.loyalty_points} onChange={handleChange} />
              </div>

              <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200">Annuler</button>
                  <button type="submit" className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100">
                    {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Style local pour les inputs (ou à mettre dans ton index.css) */}
      <style>{`
        .input-field {
            width: 100%;
            padding: 12px 16px;
            background-color: #f8fafc;
            border: 2px solid transparent;
            border-radius: 12px;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }
        .input-field:focus {
            background-color: white;
            border-color: #dc2626;
        }
      `}</style>
    </div>
  );
};