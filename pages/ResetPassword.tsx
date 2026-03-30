import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authFetch } from '../src/utils/apiClient';
import { Lock, Loader2, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (!token) {
            return setStatus({ type: 'error', message: "Le lien de réinitialisation est invalide ou manquant." });
        }

        if (password !== confirmPassword) {
            return setStatus({ type: 'error', message: "Les mots de passe ne correspondent pas." });
        }

        if (password.length < 6) {
            return setStatus({ type: 'error', message: "Le mot de passe doit contenir au moins 6 caractères." });
        }

        setIsLoading(true);

        try {
            const response = await authFetch(`/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setStatus({ type: 'success', message: "Mot de passe modifié avec succès ! Redirection..." });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                throw new Error(data.message || "Erreur lors de la modification.");
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-carbon px-4 py-12 transition-colors">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
                
                {/* 🪄 EN-TÊTE DYNAMIQUE */}
                <div 
                    className="p-8 text-center relative overflow-hidden"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50"></div>
                    <h2 className="text-3xl font-bold text-white relative z-10 flex flex-col items-center gap-2">
                        <KeyRound size={36} className="text-amber-400"/>
                        Nouveau mot de passe
                    </h2>
                    <p className="text-white/80 mt-2 text-sm relative z-10">
                        Veuillez choisir un nouveau mot de passe sécurisé.
                    </p>
                </div>

                <div className="p-8">
                    {status.message && (
                        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            {status.type === 'error' ? <AlertCircle size={20} className="flex-shrink-0" /> : <CheckCircle2 size={20} className="flex-shrink-0" />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    {!token && !status.message ? (
                         <div className="text-center p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl mb-6 flex flex-col items-center gap-2">
                             <AlertCircle size={32} />
                             <p className="font-bold">Lien invalide</p>
                             <p className="text-sm">Veuillez refaire une demande de réinitialisation.</p>
                         </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Nouveau mot de passe</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none transition-all text-sm theme-input dark:text-pure"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover-theme-text">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Confirmez le mot de passe</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        required 
                                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm dark:text-pure ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-600/20 focus:border-red-600' : 'border-slate-200 dark:border-slate-700 theme-input'}`}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg opacity-95 hover:opacity-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Enregistrer'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center pt-6 border-t border-slate-100">
                        <Link 
                            to="/login" 
                            className="text-slate-500 dark:text-slate-400 text-sm font-bold transition-colors hover-theme-text"
                        >
                            Retourner à la connexion
                        </Link>
                    </div>
                </div>
            </div>

            {/* 🪄 STYLES DYNAMIQUES */}
            <style>{`
                .theme-input:focus {
                    border-color: var(--theme-primary) !important;
                    box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 20%, transparent) !important;
                }
                .hover-theme-text:hover {
                    color: var(--theme-primary) !important;
                }
            `}</style>
        </div>
    );
}

export default ResetPassword;