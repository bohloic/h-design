import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authFetch } from '../../src/utils/apiClient';
import { Edit, Trash2, UserPlus, Gift, Mail, Phone, XCircle, Shield, User as UserIcon, ChevronDown, CheckCircle2, Eye, EyeOff, AlertCircle, Search } from 'lucide-react';
import Pagination from '../../src/components/tools/Pagination';

export const CustomerView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- FILTRAGE & RECHERCHE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = React.useMemo(() => {
    return users.filter((user: any) => {
      const matchesSearch = 
        `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm));
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);
  
  // Modal
  const [showModal, setShowModal] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Gestion des erreurs et affichage mot de passe
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '', // Nouveau champ
    loyalty_points: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🪄 LOGIQUE DE MISE EN ÉVIDENCE (Highlight)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get('highlight');
    
    if (highlightId && !loading && users.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`customer-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-glow');
          
          setTimeout(() => {
            element.classList.remove('highlight-glow');
          }, 3500);
        }
      }, 500);
    }
  }, [location.search, loading, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/users');
      if (!response.ok) throw new Error("Erreur serveur");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erreur chargement", error);
    } finally {
        setLoading(false);
    }
  }; 

  // --- GESTION DES RÔLES ---
  const handleRoleChange = async (userId: number, newRole: string) => {
    const oldUsers = [...users];
    setUsers(users.map((u: any) => u.id === userId ? { ...u, role: newRole } : u));

    try {
      const response = await authFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!response.ok) throw new Error('Erreur lors du changement de rôle');
    } catch (error) {
      console.error("Erreur rôle:", error);
      setUsers(oldUsers);
      alert("Erreur lors de la modification du rôle.");
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setFormData({ nom: '', prenom: '', email: '', phone: '', password: '', confirmPassword: '', loyalty_points: 0 });
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      phone: user.phone || '',
      password: '', 
      confirmPassword: '',
      loyalty_points: user.loyalty_points || 0
    });
    setCurrentId(user.id);
    setError('');
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 

    // Vérification des mots de passe à la création
    if (!isEditing && formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
    }

    try {
      const url = isEditing ? `/api/users/${currentId}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      const { confirmPassword, ...dataToSend } = formData;

      const response = await authFetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cet email est peut-être déjà utilisé ou une erreur est survenue.");
      }
      
      fetchUsers();
      closeModal();
    } catch (err: any) {
      setError(err.message); 
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer définitivement cet utilisateur ?")) {
      try {
        const response = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Erreur");
        fetchUsers();
      } catch (error) {
        console.error("Erreur suppression", error);
        alert("Impossible de supprimer l'utilisateur.");
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      {/* En-tête Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}
            >
                <UserPlus size={24} />
            </span>
            Gestion des Utilisateurs
          </h3>
          <p className="text-slate-500 text-sm mt-1">Gérez vos clients, votre équipe et leur fidélité.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ backgroundColor: 'var(--theme-primary)' }}
          className="w-full sm:w-auto text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-95 hover:opacity-100 transition-all shadow-lg active:scale-95"
        >
          <UserPlus size={20} /> <span className="hidden sm:inline">Ajouter un membre</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
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

        <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-200 outline-none cursor-pointer sm:w-48"
        >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="client">Clients</option>
        </select>
      </div>

      {/* Contenu : Grille Responsive */}
      {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-4"
                  style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', borderTopColor: 'var(--theme-primary)' }}
              ></div>
              Chargement...
          </div>
      ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aucun utilisateur ne correspond à vos critères.</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedUsers.map((user: any) => (
              <div key={user.id} id={`customer-${user.id}`} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                
                {/* Header Carte : Identité & Rôle */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${user.role === 'admin' ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {user.prenom ? user.prenom.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                                {user.prenom} {user.nom}
                                {user.is_verified && (
                                    <span title="Email vérifié">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                    </span>
                                )}
                            </h4>
                            <div className="flex flex-col text-xs text-slate-400 mt-1 space-y-1">
                                <span className="flex items-center gap-1"><Mail size={12} /> {user.email}</span>
                                {user.phone && <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Sécurité & Rôle */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-3">
                    
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Gift size={14}/> Fidélité</span>
                        <span className="font-black" style={{ color: 'var(--theme-primary)' }}>{user.loyalty_points || 0} pts</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            {user.role === 'admin' ? <Shield size={14} className="text-amber-500" /> : <UserIcon size={14} />} 
                            Rôle Actuel
                        </span>
                        
                        <div className="relative inline-block">
                            <select 
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className={`appearance-none text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none transition-colors cursor-pointer border ${
                                    user.role === 'admin' 
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <option value="client">Client</option>
                                <option value="admin">Administrateur</option>
                            </select>
                            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${user.role === 'admin' ? 'text-amber-600' : 'text-slate-400'}`}>
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow"></div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <button 
                        onClick={() => openEditModal(user)}
                        className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Edit size={16} /> Modifier
                    </button>
                    <button 
                        onClick={() => handleDelete(user.id)}
                        className="flex-none px-4 py-2 text-sm font-bold border rounded-xl hover:bg-red-50 flex items-center justify-center transition-colors"
                        style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

              </div>
            ))}
          </div>
      )}

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <Pagination 
                  currentPage={currentPage}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
              />
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

            {/* AFFICHEUR D'ERREURS */}
            {error && (
                <div className="mx-6 mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 font-medium text-sm border border-red-100">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
            
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

              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Téléphone</label>
                  <input className="input-field" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              {!isEditing && (
                  <>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Mot de passe</label>
                          <div className="relative">
                              <input className="input-field pr-12" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                          </div>
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Confirmez le mot de passe</label>
                          <div className="relative">
                              <input className="input-field pr-12" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                          </div>
                      </div>
                  </>
              )}

              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Points Fidélité</label>
                  <input className="input-field" type="number" name="loyalty_points" value={formData.loyalty_points} onChange={handleChange} />
              </div>

              <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200">Annuler</button>
                  <button 
                    type="submit" 
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    className="flex-[2] py-3 text-white font-bold rounded-xl opacity-95 hover:opacity-100 shadow-lg"
                  >
                    {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Style local pour les inputs avec variables CSS */}
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
            border-color: var(--theme-primary, #dc2626);
        }
      `}</style>
    </div>
  );
};