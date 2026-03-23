import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../src/utils/apiClient';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Phone, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';

function Auth({ onLoginSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- STATES ---
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [showVerification, setShowVerification] = useState(false);
    const [isForgotMode, setIsForgotMode] = useState(false);
    
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ⏱️ State pour le compte à rebours du renvoi d'email
    const [resendCooldown, setResendCooldown] = useState(0);

    const [formData, setFormData] = useState({
        nom: '', prenom: '', email: '', phone: '', password: '', confirmPassword: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const API_BASE_URL = "/api";

    // --- GESTION DU COMPTE À REBOURS ---
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setStatus({ type: '', message: '' });
        setFormData(prev => ({ ...prev, nom: '', prenom: '', password: '', confirmPassword: '' }));
        setShowVerification(false); 
        setIsForgotMode(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    // 1. MOT DE PASSE OUBLIÉ
    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) return setStatus({ type: 'error', message: "Veuillez entrer votre adresse email." });
        
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await authFetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setStatus({ type: 'success', message: "Lien envoyé ! Vérifiez votre boîte mail." });
                setTimeout(() => setIsForgotMode(false), 3000); 
            } else {
                throw new Error(data.message || "Erreur lors de l'envoi.");
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // 2. RENVOYER LE CODE DE VÉRIFICATION
    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await authFetch(`${API_BASE_URL}/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setStatus({ type: 'success', message: "Un nouveau code a été envoyé !" });
                setResendCooldown(60); 
                setVerificationCode(['', '', '', '', '', '']); 
                inputRefs.current[0]?.focus();
            } else {
                throw new Error(data.message || "Erreur lors du renvoi.");
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // 3. VÉRIFICATION DU CODE
    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = verificationCode.join('');
        if (fullCode.length !== 6) return setStatus({ type: 'error', message: "Veuillez entrer les 6 chiffres." });
        
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await authFetch(`${API_BASE_URL}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail, code: fullCode })
            });
            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('token', data.token);
                if (data.user?.role) localStorage.setItem('role', data.user.role);
                setStatus({ type: 'success', message: "Email vérifié ! Bienvenue." });
                if (onLoginSuccess) onLoginSuccess();
                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                throw new Error(data.message || "Code invalide.");
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // 4. INSCRIPTION / CONNEXION
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setStatus({ type: '', message: '' }); 

        if (!isLoginMode && formData.password !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: "Les mots de passe ne correspondent pas." });
        }

        setIsLoading(true);
        const url = isLoginMode ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
        const bodyData = isLoginMode 
            ? { email: formData.email, password: formData.password } 
            : { nom: formData.nom, prenom: formData.prenom, email: formData.email, phone: formData.phone, password: formData.password };

        try {
            const response = await authFetch(url, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(bodyData) 
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Une erreur est survenue");

            if (isLoginMode) {
                if (data.requireVerification) {
                    setRegisteredEmail(data.email || formData.email);
                    setShowVerification(true); 
                    setStatus({ type: 'success', message: data.message }); 
                } 
                else {
                    if (data.token) localStorage.setItem('token', data.token);
                    if (data.user?.role) localStorage.setItem('role', data.user.role);
                    setStatus({ type: 'success', message: "Connexion réussie !" });
                    if (onLoginSuccess) onLoginSuccess();
                    
                    const state = location.state as any;
                    setTimeout(() => navigate(data.user?.role === 'admin' ? '/admin' : (state?.from?.pathname || "/dashboard")), 500);
                }
            } else {
                if (data.requireVerification) {
                    setRegisteredEmail(data.email || formData.email);
                    setShowVerification(true);
                    setStatus({ type: 'success', message: "Code envoyé ! Vérifiez votre boîte mail." });
                    setResendCooldown(60); 
                } else {
                    setStatus({ type: 'success', message: "Compte créé avec succès ! Connectez-vous." });
                    setTimeout(toggleMode, 1500);
                }
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // --- GESTION AVANCÉE DES CASES ---
    const handleCodeChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        if (value && index < 5 && inputRefs.current[index + 1]) inputRefs.current[index + 1]?.focus();
    };
    
    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) inputRefs.current[index - 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        if (!pastedData) return;

        const newCode = [...verificationCode];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setVerificationCode(newCode);

        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in-up">
                
                {/* 🪄 EN-TÊTE DYNAMIQUE */}
                <div 
                    className={`p-8 text-center relative overflow-hidden transition-colors duration-500 ${showVerification || isForgotMode ? 'bg-slate-900' : ''}`}
                    style={(!showVerification && !isForgotMode) ? { backgroundColor: 'var(--theme-primary)' } : {}}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50"></div>
                    <h2 className="text-3xl font-bold text-white relative z-10 flex flex-col items-center gap-2">
                        {showVerification ? <><ShieldCheck size={36} className="text-green-400"/> Sécurité</> 
                        : isForgotMode ? <><KeyRound size={36} className="text-amber-400"/> Récupération</>
                        : isLoginMode ? 'Bon retour !' : 'Rejoignez-nous'}
                    </h2>
                    <p className="text-white/80 mt-2 text-sm relative z-10">
                        {showVerification ? "Entrez le code à 6 chiffres reçu par mail" 
                        : isForgotMode ? "Entrez votre email pour réinitialiser le mot de passe"
                        : isLoginMode ? "Connectez-vous pour gérer vos commandes" : "Créez votre compte pour commencer"}
                    </p>
                </div>

                <div className="p-8">
                    {/* AFFICHEUR D'ERREURS/SUCCÈS */}
                    {status.message && (
                        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            {status.type === 'error' ? <AlertCircle size={20} className="flex-shrink-0" /> : <CheckCircle2 size={20} className="flex-shrink-0" />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    {/* ÉCRAN 1 : MOT DE PASSE OUBLIÉ */}
                    {isForgotMode && !showVerification ? (
                         <form onSubmit={handleForgotSubmit} className="space-y-5 animate-in fade-in duration-300">
                             <div className="space-y-1">
                                 <label className="text-xs font-bold text-slate-500 ml-1">Email associé à votre compte</label>
                                 <div className="relative">
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={18} /></div>
                                     <input type="email" name="email" placeholder="exemple@email.com" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm theme-input"/>
                                 </div>
                             </div>
                             
                             <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                 {isLoading ? <Loader2 className="animate-spin" /> : 'Recevoir le lien'}
                             </button>
                             <div className="text-center mt-4">
                                 <button type="button" onClick={() => setIsForgotMode(false)} className="text-sm text-slate-500 font-bold hover-theme-text transition-colors">
                                     Annuler et retourner à la connexion
                                 </button>
                             </div>
                         </form>
                    ) 
                    
                    /* ÉCRAN 2 : VÉRIFICATION DU CODE */
                    : showVerification ? (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <form onSubmit={handleVerifySubmit} className="space-y-6">
                                <div className="flex justify-between gap-2 sm:gap-4 px-2">
                                    {verificationCode.map((digit, index) => (
                                        <input 
                                            key={index} 
                                            ref={(el) => { inputRefs.current[index] = el; }} 
                                            type="text" 
                                            maxLength={1} 
                                            value={digit} 
                                            onChange={(e) => handleCodeChange(index, e.target.value)} 
                                            onKeyDown={(e) => handleCodeKeyDown(index, e)} 
                                            onPaste={handlePaste} 
                                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all theme-input" 
                                        />
                                    ))}
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoading || verificationCode.join('').length !== 6} 
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                    className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:brightness-110"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Valider mon compte'}
                                </button>
                            </form>

                            {/* BOUTON RENVOYER LE CODE */}
                            <div className="text-center pt-2">
                                <button 
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0 || isLoading}
                                    className="text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors text-slate-500 hover-theme-text disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                                    {resendCooldown > 0 
                                        ? `Renvoyer le code dans ${resendCooldown}s` 
                                        : "Je n'ai pas reçu le code"}
                                </button>
                            </div>
                        </div>
                    ) 
                    
                    /* ÉCRAN 3 : INSCRIPTION / CONNEXION CLASSIQUE */
                    : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLoginMode && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Nom</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                                                <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required={!isLoginMode} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm theme-input"/>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Prénom</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                                                <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required={!isLoginMode} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm theme-input"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Téléphone</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone size={18} /></div>
                                            <input type="tel" name="phone" placeholder="Votre numéro" value={formData.phone} onChange={handleChange} required={!isLoginMode} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm theme-input"/>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={18} /></div>
                                    <input type="email" name="email" placeholder="exemple@email.com" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm theme-input"/>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Mot de passe</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                                    <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm theme-input"/>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover-theme-text transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {!isLoginMode && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Confirmez le mot de passe</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            name="confirmPassword" 
                                            placeholder="••••••••" 
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            required={!isLoginMode} 
                                            // La classe d'erreur rouge prime, sinon on utilise le style du thème
                                            className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl focus:outline-none transition-all text-sm ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:ring-2 focus:ring-red-600/20 focus:border-red-600' : 'border-slate-200 theme-input'}`}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover-theme-text transition-colors">
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 hover:brightness-110"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <>{isLoginMode ? 'Se connecter' : "S'inscrire"}<ArrowRight size={20} /></>}
                            </button>
                            
                            {isLoginMode && (
                                <div className="text-center mt-4">
                                    <button type="button" onClick={() => setIsForgotMode(true)} className="text-sm text-slate-500 font-bold hover-theme-text transition-colors">
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {/* Footer / Toggle */}
                    {!showVerification && !isForgotMode && (
                        <div className="mt-8 text-center pt-6 border-t border-slate-100">
                            <p className="text-slate-500 text-sm">{isLoginMode ? "Pas encore de compte ?" : "Déjà inscrit ?"}</p>
                            <button 
                                onClick={toggleMode} 
                                style={{ color: 'var(--theme-primary)' }}
                                className="font-bold hover:underline mt-1 transition-colors"
                            >
                                {isLoginMode ? "Créer un compte maintenant" : "Se connecter"}
                            </button>
                        </div>
                    )}
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

export default Auth;