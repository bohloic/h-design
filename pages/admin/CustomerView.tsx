import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../src/styles/AdminUsers.css';

export const CustomerView = () => {
  const [users, setUsers] = useState([]);
  
  // Nouvel état pour gérer la visibilité de la modale
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
      const response = await axios.get('http://localhost:205/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Erreur chargement", error);
    }
  }; 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fonction pour ouvrir la modale en mode "Création"
  const openCreateModal = () => {
    setFormData({ nom: '', prenom: '', email: '', password: '', loyalty_points: 0 });
    setIsEditing(false);
    setShowModal(true);
  };

  // Fonction pour ouvrir la modale en mode "Édition"
  const openEditModal = (user) => {
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      password: '', // On ne remplit pas le mdp pour sécurité
      loyalty_points: user.loyalty_points
    });
    setCurrentId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  // Fermer la modale
  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:205/api/users/${currentId}`, formData);
      } else {
        await axios.post('http://localhost:205/api/users', formData);
      }
      fetchUsers();
      closeModal(); // On ferme la modale après succès
    } catch (error) {
      alert("Erreur lors de l'opération");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement cet utilisateur ?")) {
      try {
        await axios.delete(`http://localhost:205/api/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error("Erreur suppression", error);
      }
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Gestion des Utilisateurs</h2>

      {/* --- Bouton Déclencheur --- */}
      <button className="add-user-btn" onClick={openCreateModal}>
        + Ajouter un membre
      </button>

      {/* --- La Modale (N'apparaît que si showModal est true) --- */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          {/* onStopPropagation empêche la modale de se fermer si on clique DANS le formulaire */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>&times;</button>
            
            <h3 className="form-title">
              {isEditing ? '✏️ Modifier le profil' : '✨ Nouveau membre'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <input className="input-field" type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required />
                <input className="input-field" type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
                <input className="input-field" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                
                {!isEditing && (
                   <input className="input-field" type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required />
                )}
                
                <input className="input-field" type="number" name="loyalty_points" placeholder="Points Fidélité" value={formData.loyalty_points} onChange={handleChange} />
              </div>
              
              <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className={`btn ${isEditing ? 'btn-warning' : 'btn-primary'}`}>
                  {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Grille des Utilisateurs --- */}
      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="card-header">
              <div className="avatar-placeholder">
                {user.prenom ? user.prenom.charAt(0) : 'U'}{user.nom ? user.nom.charAt(0) : ''}
              </div>
              <div>
                <h4 className="user-name">{user.prenom} {user.nom}</h4>
                <div className="user-email">{user.email}</div>
              </div>
            </div>

            <div>
              <span className="loyalty-badge">
                🎁 {user.loyalty_points} Points
              </span>
            </div>

            <div className="card-actions">
              {/* Ici on appelle openEditModal au lieu de handleEdit */}
              <button className="action-btn edit-btn" onClick={() => openEditModal(user)}>
                Éditer
              </button>
              <button className="action-btn delete-btn" onClick={() => handleDelete(user.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
