import React, { useState } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { useLocation, useNavigate } from 'react-router-dom';
// Ajout d'icônes pour un look pro
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function Auth({ onLoginSuccess }) {

    const navigate = useNavigate();
    const location = useLocation();
    
    // --- STATES ---
    const [isLoginMode, setIsLoginMode] = useState(true); // Par défaut sur Connexion
    const [isLoading, setIsLoading] = useState(false); // État de chargement visuel

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });

    const API_BASE_URL = "/api";

    // --- HANDLERS ---

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setStatus({ type: '', message: '' }); 
        setIsLoading(true);

        let url = '';
        let bodyData = {};

        if (isLoginMode) {
            url = `${API_BASE_URL}/login`;
            bodyData = { email: formData.email, password: formData.password };
        } else {
            url = `${API_BASE_URL}/register`;
            bodyData = formData; 
        }

        try {
            const response = await authFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Une erreur est survenue");
            }

            // SUCCÈS
            if (isLoginMode) {
                // Gestion du Token
                if (data.token) localStorage.setItem('token', data.token);
                if (data.user && data.user.role) localStorage.setItem('role', data.user.role);
                
                setStatus({ type: 'success', message: "Connexion réussie !" });
                
                // Callback parent
                if (onLoginSuccess) onLoginSuccess();

                // Redirection (petit délai pour voir le message de succès)
                setTimeout(() => {
                    const from = location.state?.from?.pathname || "/dashboard";
                    // Si admin, on force vers admin, sinon dashboard ou page précédente
                    if (data.user && data.user.role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate(from);
                    }
                }, 500);

            } else {
                // Inscription réussie -> On passe au login
                setStatus({ type: 'success', message: "Compte créé avec succès ! Connectez-vous." });
                setTimeout(() => {
                    toggleMode();
                }, 1500);
            }

        } catch (error) {
            console.error("Erreur Auth:", error);
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setStatus({ type: '', message: '' });
        // On ne vide pas l'email pour l'UX, mais on vide le reste
        setFormData(prev => ({ ...prev, nom: '', prenom: '', password: '' }));
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
            
            {/* Carte principale responsive */}
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in-up">
                
                {/* En-tête */}
                <div className="bg-red-600 p-8 text-center relative overflow-hidden">
                    {/* Décoration d'arrière-plan */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50"></div>
                    
                    <h2 className="text-3xl font-bold text-white relative z-10">
                        {isLoginMode ? 'Bon retour !' : 'Rejoignez-nous'}
                    </h2>
                    <p className="text-red-100 mt-2 text-sm relative z-10">
                        {isLoginMode 
                            ? "Connectez-vous pour gérer vos commandes" 
                            : "Créez votre compte pour commencer"}
                    </p>
                </div>

                <div className="p-8">
                    {/* Zone de message (Alertes) */}
                    {status.message && (
                        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
                            status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                        }`}>
                            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Champs Inscription uniquement */}
                        {!isLoginMode && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Nom</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            name="nom"
                                            placeholder="Nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required={!isLoginMode}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Prénom</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            name="prenom"
                                            placeholder="Prénom"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            required={!isLoginMode}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="exemple@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Mot de passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Bouton Submit */}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    {isLoginMode ? 'Se connecter' : "S'inscrire"}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer / Toggle */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            {isLoginMode ? "Pas encore de compte ?" : "Déjà inscrit ?"}
                        </p>
                        <button 
                            onClick={toggleMode} 
                            className="text-red-600 font-bold hover:underline mt-1 transition-colors"
                        >
                            {isLoginMode ? "Créer un compte maintenant" : "Se connecter"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Auth;