// src/Auth.jsx
import React, { useState } from 'react';
import './../src/styles/Auth.css'; // On importe le CSS
import { useNavigate } from 'react-router-dom';

function Auth({ onLoginSuccess }) {

    const navigate = useNavigate(); // <--- Hook pour la redirection


    // --- STATES (États) ---
    // 1. Basculer entre Connexion (true) et Inscription (false)
    const [isLoginMode, setIsLoginMode] = useState(false);

    // 2. Stocker les données du formulaire
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: ''
    });

    // 3. Gérer les messages de succès ou d'erreur
    const [status, setStatus] = useState({ type: '', message: '' });

    // ADRESSE DU BACKEND (Vérifiez votre port !)
    const API_BASE_URL = "http://localhost:205/api";


    // --- HANDLERS (Fonctions) ---

    // Gère le changement dans les inputs
    const handleChange = (e) => {
        setFormData({
            ...formData, // On garde les autres champs
            [e.target.name]: e.target.value // On met à jour celui qui change
        });
    };

    // Gère la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        setStatus({ type: '', message: '' }); // Reset des messages

        // Détermination de l'URL et du Body selon le mode
        let url = '';
        let bodyData = {};

        if (isLoginMode) {
            // --- MODE CONNEXION ---
            url = `${API_BASE_URL}/login`; // TODO: Créer cette route côté backend !
            bodyData = { email: formData.email, password: formData.password };
        } else {
            // --- MODE INSCRIPTION ---
            url = `${API_BASE_URL}/register`; // C'est la route qu'on a créée ensemble (POST)
            // Pour l'inscription, on envoie tout (nom, email, password)
            bodyData = formData; 
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();

            if (isLoginMode) {
                // A. Stocker le token
                localStorage.setItem('token', data.token);

                // B. Prévenir App.tsx que c'est connecté !
                if (onLoginSuccess) {
                    onLoginSuccess();
                }

                // C. Rediriger vers le dashboard
                navigate('/dashboard');
                setIsLoginMode(!isLoginMode)
            } else{
                 navigate('/login');
            }

            if (!response.ok) {
                // Si le serveur renvoie une erreur (ex: 400, 404, 500)
                throw new Error(data.message || "Une erreur est survenue");
            }

            // Succès !
            setStatus({ type: 'success', message: isLoginMode ? "Connexion réussie !" : "Inscription réussie !" });
            console.log("Réponse du serveur:", data);

            //vider le formulaire 
            e.target.reset();
            // TODO: Si connexion réussie, stocker le token reçu ici (ex: localStorage)

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    // Fonction pour basculer de mode et nettoyer le formulaire
    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setStatus({ type: '', message: '' });
        setFormData({ nom: '',prenom: '', email: '', password: '' });
    };


    // --- RENDER (Affichage HTML) ---
    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLoginMode ? 'Connexion' : 'Inscription'}</h2>

                {/* Zone de message (succès/erreur) */}
                {status.message && (
                    <div className={`message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* Le champ NOM ne s'affiche que si on n'est PAS en mode connexion */}
                    {!isLoginMode && (
                        <div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="nom"
                                    placeholder="Votre nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required={!isLoginMode} // Requis seulement en inscription
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="prenom"
                                    placeholder="Votre prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    required={!isLoginMode} // Requis seulement en inscription
                                />
                            </div>
                            

                        </div>
                    )}

                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Votre email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Votre mot de passe"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit">
                        {isLoginMode ? 'Se connecter' : "S'inscrire"}
                    </button>
                </form>

                {/* Bouton pour changer de mode */}
                <p className="toggle-text">
                    {isLoginMode ? "Pas encore de compte ?" : "Déjà inscrit ?"}
                    <button onClick={toggleMode} className="toggle-btn">
                        {isLoginMode ? "Créer un compte" : "Se connecter"}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Auth;