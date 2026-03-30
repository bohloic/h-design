import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../src/utils/apiClient';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Phone, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import { useNotificationStore } from '../src/store/useNotificationStore';
import { jwtDecode } from 'jwt-decode';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import AppleSignin, { appleAuthHelpers } from 'react-apple-signin-auth';
import ReCAPTCHA from "react-google-recaptcha";

interface MonTokenCustom {
    userId: string;
    email: string;
    role: string;
    exp: number;
}

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
    const [captchaVerified, setCaptchaVerified] = useState(false);

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

        // 🛠️ MODE DEV : code universel 000000
        const isDevBypass = import.meta.env.VITE_DEV_OTP_BYPASS === 'true' && fullCode === '000000';

        try {
            if (isDevBypass) {
                // En dev, on passe directement par le login pour récupérer le token
                const loginResponse = await authFetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: registeredEmail, password: '_dev_bypass_', devBypass: true })
                });
                const loginData = await loginResponse.json();
                if (loginData.token) {
                    localStorage.setItem('token', loginData.token);
                    if (loginData.user?.role) localStorage.setItem('role', loginData.user.role);
                }
                setStatus({ type: 'success', message: "⚠️ Mode DEV — Compte validé sans vérification." });
                if (onLoginSuccess) onLoginSuccess();
                setTimeout(() => navigate('/dashboard'), 1000);
                return;
            }

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

                    let decodedUserId = '';
                    try {
                        const decoded = jwtDecode<MonTokenCustom>(data.token);
                        decodedUserId = String(decoded.userId);
                    } catch { }

                    useNotificationStore.getState().addNotification({
                        userId: decodedUserId,
                        title: "Bienvenue !",
                        message: "Connecté avec succès. Découvrez nos nouveautés.",
                        type: "success"
                    });

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

    // --- GESTION AVANCÉE DES CASES (MODERNISÉ : HIDDEN INPUT) ---
    const hiddenInputRef = React.useRef<HTMLInputElement>(null);

    const handleContainerClick = () => {
        hiddenInputRef.current?.focus();
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        const newCode = val.split('');
        // Fill the rest with empty strings
        while (newCode.length < 6) newCode.push('');
        setVerificationCode(newCode);
    };

    // --- OAUTH LOGIC ---
    const loginGoogle = useGoogleLogin({
        onSuccess: (codeResponse) => handleSocialLogin('Google'),
        onError: () => setStatus({ type: 'error', message: 'Erreur Google' })
    });

    const loginApple = async () => {
        try {
            const response = await appleAuthHelpers.signIn({
                authOptions: {
                    clientId: 'com.hdesigner.web',
                    scope: 'email name',
                    redirectURI: 'https://hdesigner.ci/api/auth/apple/callback',
                    state: '',
                    nonce: 'nonce',
                    usePopup: true
                }
            });
            handleSocialLogin('Apple');
        } catch (error) {
            setStatus({ type: 'error', message: 'Erreur Apple' });
        }
    };

    // --- SOCIAL LOGINS (SIMULATION) ---
    const handleSocialLogin = async (provider: string) => {
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        // Simulation d'un délai réseau pour l'authentification sociale
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Dans un cas réel, on appellerait window.google.accounts.id.prompt() 
            // ou on redirigerait vers une URL de callback backend.

            // Simulation d'un succès
            const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTkiLCJlbWFpbCI6InNvY2lhbEB1c2VyLmNvbSIsInJvbGUiOiJjbGllbnQifQ";
            localStorage.setItem('token', mockToken);
            localStorage.setItem('role', 'client');

            useNotificationStore.getState().addNotification({
                userId: '999',
                title: `Connexion ${provider}`,
                message: `Bienvenue ! Vous êtes connecté via ${provider}.`,
                type: "success"
            });

            setStatus({ type: 'success', message: `Connecté avec succès via ${provider} !` });

            if (onLoginSuccess) onLoginSuccess();
            setTimeout(() => navigate('/dashboard'), 800);

        } catch (error) {
            setStatus({ type: 'error', message: `Échec de la connexion via ${provider}.` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center relative"
            style={{ backgroundImage: "url('/src/assets/image1.png')" }}
        >
            {/* Overlay sombre ou flouté pour faire ressortir le formulaire */}
            <div className="absolute inset-0 bg-[#0a1118]/40 backdrop-blur-md"></div>

            {/* 🏰 CARTE PRINCIPALE SPLIT-SCREEN */}
            <div className="max-w-[1200px] w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px] animate-in fade-in zoom-in duration-700 relative z-10">

                {/* --- PANNEAU GAUCHE : IMAGE --- */}
                <div className="relative hidden md:flex md:w-1/2 bg-cover bg-center overflow-hidden">
                    {/* Using the image from assets as requested */}
                    <img src="/src/assets/image1.png" alt="Gift box" className="absolute inset-0 w-full h-full object-cover" />

                    {/* Logo (cliquable vers l'accueil) superposé sur l'image en haut à gauche */}
                    <div className="absolute top-8 left-8 z-10">
                        <button onClick={() => navigate('/')} className="focus:outline-none hover:opacity-80 transition-opacity">
                            <img src="/src/assets/Logo .png" alt="Logo" className="h-16 w-auto brightness-0 invert" />
                        </button>
                    </div>
                </div>

                {/* --- PANNEAU DROIT : FORMULAIRE --- */}
                <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white relative">

                    {/* Logo pour mobile (visible uniquement sur petits écrans) */}
                    <div className="md:hidden block mb-8 flex justify-center">
                        <button onClick={() => navigate('/')} className="focus:outline-none hover:opacity-80 transition-opacity">
                            <img src="/src/assets/Logo .png" alt="Logo" className="h-20 w-auto" />
                        </button>
                    </div>

                    <div className="w-full max-w-md mx-auto">
                        {/* Header du Formulaire */}
                        <div className="mb-10 text-center md:text-left">
                            <h1 className="text-[32px] font-black text-[#0b2e35] uppercase tracking-tight mb-3">
                                {showVerification ? "VÉRIFICATION" : isForgotMode ? "RÉCUPÉRATION" : isLoginMode ? "BON RETOUR !" : "CRÉER UN COMPTE"}
                            </h1>
                            <p className="text-gray-500 font-medium text-[15px]">
                                {showVerification ? "Entrez le code reçu par e-mail."
                                    : isForgotMode ? "Saisissez votre e-mail pour réinitialiser."
                                        : isLoginMode ? "Heureux de vous revoir ! Veuillez saisir vos identifiants." : "Veuillez entrer vos informations pour créer un compte."}
                            </p>
                        </div>

                        {/* AFFICHEUR D'ERREURS/SUCCÈS */}
                        {status.message && (
                            <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {status.type === 'error' ? <AlertCircle size={20} className="flex-shrink-0" /> : <CheckCircle2 size={20} className="flex-shrink-0" />}
                                <span>{status.message}</span>
                            </div>
                        )}

                        {/* --- CONTENU DYNAMIQUE DES FORMULAIRES --- */}
                        <div className="space-y-6">

                            {isForgotMode && !showVerification ? (
                                <form onSubmit={handleForgotSubmit} className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-2">
                                        <label htmlFor="forgot-email" className="text-[13px] font-bold text-[#0b2e35]">Adresse e-mail</label>
                                        <input id="forgot-email" type="email" name="email" placeholder="Votre adresse e-mail" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0b2e35] focus:ring-1 focus:ring-[#0b2e35] transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal" />
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full bg-[#0b2e35] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4">
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Recevoir le lien'}
                                    </button>
                                    <button type="button" onClick={() => setIsForgotMode(false)} className="w-full text-center text-[14px] text-gray-500 font-bold hover:text-[#0b2e35] transition-colors mt-2">
                                        Annuler
                                    </button>
                                </form>
                            ) : showVerification ? (
                                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                                    <form onSubmit={handleVerifySubmit} className="space-y-8">
                                        <div className="relative flex justify-between gap-2 sm:gap-3 cursor-text" onClick={handleContainerClick} aria-label="Code de vérification à 6 chiffres">
                                            <input ref={hiddenInputRef} type="tel" pattern="\d*" className="absolute opacity-0 pointer-events-none inset-0 w-full" value={verificationCode.join('')} onChange={handleOtpChange} autoFocus aria-label="Entrez votre code de vérification" />
                                            {verificationCode.map((digit, index) => (
                                                <div key={index} className={`w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center text-2xl font-bold rounded-xl border transition-all ${verificationCode.join('').length === index ? 'border-[#0b2e35] bg-white scale-105 shadow-sm' : digit ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'} ${digit ? 'text-[#0b2e35]' : 'text-gray-400'}`}>
                                                    {digit || (verificationCode.join('').length === index ? '|' : '')}
                                                </div>
                                            ))}
                                        </div>
                                        <button type="submit" disabled={isLoading || verificationCode.join('').length !== 6} className="w-full bg-[#0b2e35] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4">
                                            {isLoading ? <Loader2 className="animate-spin" /> : 'Valider mon compte'}
                                        </button>
                                    </form>
                                    <button onClick={handleResendCode} disabled={resendCooldown > 0 || isLoading} className="w-full text-[14px] font-bold text-gray-500 hover:text-[#0b2e35] transition-colors flex items-center justify-center gap-2">
                                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                                        {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {!isLoginMode && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="reg-nom" className="text-[13px] font-bold text-gray-700">Nom</label>
                                                    <input id="reg-nom" type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required={!isLoginMode} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0b2e35] focus:ring-1 focus:ring-[#0b2e35] transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="reg-prenom" className="text-[13px] font-bold text-gray-700">Prénom</label>
                                                    <input id="reg-prenom" type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required={!isLoginMode} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0b2e35] focus:ring-1 focus:ring-[#0b2e35] transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="reg-phone" className="text-[13px] font-bold text-gray-700">Téléphone</label>
                                                <input id="reg-phone" type="tel" name="phone" placeholder="Votre numéro" value={formData.phone} onChange={handleChange} required={!isLoginMode} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0b2e35] focus:ring-1 focus:ring-[#0b2e35] transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal" />
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-2">
                                        <label htmlFor="auth-email" className="text-[13px] font-bold text-gray-700">Adresse e-mail</label>
                                        <input id="auth-email" type="email" name="email" placeholder="Votre adresse e-mail" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0b2e35] focus:ring-1 focus:ring-[#0b2e35] transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal" />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="auth-password" className="text-[13px] font-bold text-gray-700">Mot de passe</label>
                                        <div className="relative">
                                            <input id="auth-password" type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className="w-full pl-4 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0b2e35] focus:ring-1 focus:ring-[#0b2e35] transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {!isLoginMode && (
                                        <div className="space-y-2">
                                            <label htmlFor="auth-confirm" className="text-[13px] font-bold text-gray-700">Confirmez le mot de passe</label>
                                            <input id="auth-confirm" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required={!isLoginMode} className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-1 transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#0b2e35] focus:ring-[#0b2e35]'}`} />
                                        </div>
                                    )}

                                    {/* Ligne "Remember me" & "Forgot password" */}
                                    {isLoginMode && (
                                        <div className="flex items-center justify-between pt-1 pb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0b2e35] focus:ring-[#0b2e35]" />
                                                <span className="text-[13px] font-medium text-gray-600">Se souvenir de moi</span>
                                            </label>
                                            <button type="button" onClick={() => setIsForgotMode(true)} className="text-[13px] font-bold text-[#0b2e35] hover:underline focus:outline-none rounded">
                                                Mot de passe oublié ?
                                            </button>
                                        </div>
                                    )}

                                    {/* Captcha */}
                                    <div className="pt-2 flex justify-center">
                                        <ReCAPTCHA
                                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                            onChange={(val) => setCaptchaVerified(!!val)}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button type="submit" disabled={isLoading || !captchaVerified} className="w-full bg-[#0b2e35] text-white py-3.5 rounded-xl font-bold text-[15px] shadow-sm hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b2e35]">
                                            {isLoading ? <Loader2 className="animate-spin" /> : <>{isLoginMode ? 'Se connecter' : "S'inscrire"}</>}
                                        </button>
                                    </div>

                                    {/* --- SOCIAL LOGINS --- */}
                                    <div className="pt-2 space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                                                    loginGoogle();
                                                } else {
                                                    // Simulation de succès (Mode Développement) car pas de vraie clé
                                                    handleSocialLogin('Google');
                                                }
                                            }}
                                            aria-label="Continuer avec Google"
                                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 rounded-xl font-bold text-[14px] text-gray-700 hover:bg-gray-50 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" /></svg>
                                            Continuer avec Google
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (import.meta.env.VITE_APPLE_CLIENT_ID) {
                                                    loginApple();
                                                } else {
                                                    // Simulation de succès (Mode Développement) car pas de vraie clé
                                                    handleSocialLogin('Apple');
                                                }
                                            }}
                                            aria-label="Continuer avec Apple"
                                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-black rounded-xl font-bold text-[14px] text-white hover:bg-gray-900 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 384 512" fill="white" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                                            Continuer avec Apple
                                        </button>
                                    </div>

                                    {/* Toggle Mode */}
                                    <div className="mt-8 text-center pt-2">
                                        <p className="text-gray-500 text-[14px] font-medium">
                                            {isLoginMode ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
                                            <button onClick={toggleMode} className="ml-1.5 font-bold text-[#0b2e35] hover:underline focus:outline-none rounded">
                                                {isLoginMode ? "S'inscrire" : "Se connecter"}
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthWrapper(props: any) {
    // Clé statique par défaut juste pour empêcher l'erreur de crash du provider
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "static-mock-key-for-provider.apps.google.com";

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <Auth {...props} />
        </GoogleOAuthProvider>
    );
}

