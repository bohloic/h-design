import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authFetch, safeParseJson } from '../src/utils/apiClient';
import { CreditCard, MapPin, CheckCircle2, ArrowRight, Wallet, Lock, Truck, Loader2, Star, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '../src/components/tools/SafeImage';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useNotificationStore } from '../src/store/useNotificationStore';
import { sanitizeFormData, isValidEmail } from '../src/utils/security';
import ModernCaptcha from '../src/components/security/ModernCaptcha';

export interface CartItem {
  id: string | number;
  product_id?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: {
    size?: string;
    color?: string;
    variant_id?: string | number | null;
    customization?: any;
  };
}

interface UserData {
  id?: string | number;
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

interface CheckoutProps {
  cartItems: CartItem[];
  onClearCart: () => void;
  data: UserData;
}

interface MonTokenCustom {
  userId: string;
  email: string;
  role: string;
  exp: number;
}
export const DELIVERY_ZONES = [
  { name: 'Cocody', fee: 2000, label: 'Cocody (Angré, Riviera, Deux-Plateaux) — 2 000 FCFA' },
  { name: 'Plateau', fee: 2000, label: 'Plateau (Centre-ville) — 2 000 FCFA' },
  { name: 'Marcory / Treichville', fee: 2000, label: 'Marcory / Treichville / Zone 4 — 2 000 FCFA' },
  { name: 'Yopougon', fee: 2500, label: 'Yopougon (Niangon, Maroc, Selmer) — 2 500 FCFA' },
  { name: 'Koumassi / Port-Bouët', fee: 2500, label: 'Koumassi / Port-Bouët / Vridi — 2 500 FCFA' },
  { name: 'Abobo / Anyama', fee: 3000, label: 'Abobo / Anyama — 3 000 FCFA' },
  { name: 'Grand-Bassam / Bingerville', fee: 3000, label: 'Grand-Bassam / Bingerville — 3 000 FCFA' },
  { name: 'Intérieur du pays', fee: 4000, label: 'Intérieur du pays (Bouaké, Yamoussoukro...) — 4 000 FCFA' },
];

const Checkout: React.FC<CheckoutProps> = ({ cartItems, data }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const preferredPaymentMethod = usePaymentStore(state => state.preferredMethod);
  const [paymentMethod, setPaymentMethod] = useState<'Carte' | 'Mobile Money' | null>(
    (preferredPaymentMethod as string) === 'Espèces' ? null : (preferredPaymentMethod as any)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [userPoints, setUserPoints] = useState<number>(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);

  const [stockErrors, setStockErrors] = useState<any[]>([]);
  
  // 🚨 Gestion des alertes et erreurs de validation en direct
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nom?: string;
    prenom?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
  }>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // 🛡️ Protection Anti-Robot Turnstile / Captcha
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string>('');

  // 💾 Persistance des formulaires en sessionStorage (anti-perte en cas de rechargement/navigation accidentelle)
  const [formData, setFormData] = useState(() => {
    try {
      const savedDraft = sessionStorage.getItem('hdesigner_checkout_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return {
          userId: data?.id || parsed.userId || '',
          nom: data?.nom || parsed.nom || '',
          prenom: data?.prenom || parsed.prenom || '',
          address: data?.address || parsed.address || '',
          phone: data?.phone || parsed.phone || '',
          email: data?.email || parsed.email || '',
          city: data?.city || parsed.city || 'Cocody'
        };
      }
    } catch (e) {}
    return {
      userId: data?.id || '',
      nom: data?.nom || '',
      prenom: data?.prenom || '',
      address: data?.address || '',
      phone: data?.phone || '',
      email: data?.email || '',
      city: data?.city || 'Cocody'
    };
  });

  const progressBarRef = useRef<HTMLDivElement>(null);

  // Synchronise automatiquement toute saisie dans sessionStorage
  useEffect(() => {
    sessionStorage.setItem('hdesigner_checkout_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData(prev => ({
        ...prev,
        userId: data.id || prev.userId,
        nom: data.nom || prev.nom,
        prenom: data.prenom || prev.prenom,
        address: data.address || prev.address,
        phone: data.phone || prev.phone,
        email: data.email || prev.email,
        city: data.city || prev.city || 'Cocody'
      }));
    }
  }, [data]);
  const pointsRequired = 200;
  const canUsePoints = userPoints >= pointsRequired;
  const discountAmount = useLoyaltyPoints && cartItems.length > 0 ? cartItems[0].price : 0;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // 🚚 Frais de livraison dynamiques selon la commune (ou gratuité dès 50 000 FCFA)
  const matchedZone = DELIVERY_ZONES.find(z => z.name.toLowerCase() === (formData.city || '').toLowerCase()) || DELIVERY_ZONES[0];
  const baseShippingFee = matchedZone ? matchedZone.fee : 2000;
  const isFreeShipping = subtotal >= 50000;
  const shipping = isFreeShipping ? 0 : baseShippingFee;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  useLayoutEffect(() => {
    if (progressBarRef.current) {
      const percentage = Math.min(100, (userPoints / pointsRequired) * 100);
      progressBarRef.current.style.width = `${percentage}%`;
    }
  }, [userPoints, pointsRequired, step]); // Ajout de 'step' pour re-déclencher l'animation au passage à l'étape 2

  const handleNext = () => {
    if (step === 1) {
      const cleanNom = (formData.nom || '').trim();
      const cleanPrenom = (formData.prenom || '').trim();
      const cleanEmail = (formData.email || '').trim().toLowerCase();
      const cleanAddress = (formData.address || '').trim();
      const cleanCity = (formData.city || '').trim();
      const cleanPhone = (formData.phone || '').trim().replace(/\s+/g, '');

      const errors: typeof fieldErrors = {};

      if (!cleanPrenom) {
        errors.prenom = "Le prénom est obligatoire.";
      } else if (cleanPrenom.length < 2) {
        errors.prenom = "Le prénom doit comporter au moins 2 caractères.";
      }

      if (!cleanNom) {
        errors.nom = "Le nom de famille est obligatoire.";
      } else if (cleanNom.length < 2) {
        errors.nom = "Le nom doit comporter au moins 2 caractères.";
      }

      if (!cleanEmail) {
        errors.email = "L'adresse email est requise pour le suivi.";
      } else if (!isValidEmail(cleanEmail)) {
        errors.email = "Format d'email invalide (ex: contact@exemple.com).";
      }

      const ivorianPhoneRegex = /^(01|05|07)\d{8}$/;
      if (!cleanPhone) {
        errors.phone = "Le numéro de téléphone est obligatoire.";
      } else if (!ivorianPhoneRegex.test(cleanPhone)) {
        errors.phone = "Numéro ivoirien invalide : 10 chiffres débutant par 01, 05 ou 07.";
      }

      if (!cleanCity) {
        errors.city = "Veuillez choisir votre commune ou zone de livraison.";
      }

      if (!cleanAddress) {
        errors.address = "L'adresse de livraison complète est obligatoire.";
      } else if (cleanAddress.length < 5) {
        errors.address = "L'adresse doit comporter au moins 5 caractères (Rue, quartier, repère).";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setFormError("Certains champs sont incomplets ou invalides. Veuillez corriger les informations en rouge ci-dessous.");
        useNotificationStore.getState().addNotification({
          title: "Champs requis",
          message: "Veuillez corriger les champs en rouge avant de passer à l'étape suivante.",
          type: "warning"
        });
        const formEl = document.getElementById('checkout-step1-form');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      setFieldErrors({});
      setFormError(null);
    }

    if (step === 2) {
      if (!paymentMethod) {
        setPaymentError("Veuillez sélectionner un mode de paiement (Paiement Mobile ou Carte) pour continuer.");
        useNotificationStore.getState().addNotification({
          title: "Mode de paiement requis",
          message: "Veuillez choisir votre mode de paiement pour poursuivre.",
          type: "warning"
        });
        return;
      }
      setPaymentError(null);
    }

    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStockErrors([]);
    setFormError(null);
    setPaymentError(null);
    setOrderError(null);
    setStep(step - 1);
  };

  const handleFinish = async () => {
    if (isLoading) return;
    const token = localStorage.getItem('token');
    setOrderError(null);

    const userEmail = (formData.email || '').trim().toLowerCase();
    if (!userEmail || !isValidEmail(userEmail)) {
      setFieldErrors(prev => ({ ...prev, email: "Adresse email obligatoire et valide." }));
      setFormError("Veuillez fournir une adresse email valide pour la réception de votre confirmation et le paiement.");
      useNotificationStore.getState().addNotification({
        title: "Email invalide",
        message: "Veuillez fournir une adresse email valide pour la réception de votre confirmation et le paiement.",
        type: "warning"
      });
      setStep(1);
      return;
    }

    if (!captchaToken) {
      setCaptchaError("Veuillez valider le test de sécurité anti-robot ci-dessous avant de procéder au paiement.");
      setOrderError("Vérification anti-robot requise avant de valider votre commande.");
      useNotificationStore.getState().addNotification({
        title: "Vérification requise",
        message: "Veuillez valider le test de sécurité anti-robot ci-dessous.",
        type: "warning"
      });
      return;
    }
    setCaptchaError('');

    let finalUserId = formData.userId || null;
    if (token) {
      try {
        const decoded = jwtDecode<MonTokenCustom>(token);
        finalUserId = decoded.userId;
      } catch (err) {
        console.error("Erreur décodage token", err);
      }
    }

    setIsLoading(true);
    setStockErrors([]);

    // 🔐 Sanitisation anti-XSS avant envoi au serveur
    const safeFormData = sanitizeFormData(formData);

    try {
      const URL_ORDER = '/api/orders';
      const orderResponse = await authFetch(URL_ORDER, {
        method: 'POST',
        body: JSON.stringify({
          userId: finalUserId,
          cartItems: cartItems,
          shippingDetails: { ...safeFormData, email: userEmail },
          paymentMethod: paymentMethod,
          totalAmount: total,
          useLoyaltyPoints: useLoyaltyPoints
        })
      });

      const orderData = await safeParseJson(orderResponse);

      if (!orderResponse || !orderResponse.ok) {
        throw new Error(orderData?.message || "Erreur lors de la création de la commande");
      }

      const newOrderId = orderData.orderId;

      // 💳 Initialisation du paiement Paystack (Carte / Mobile Money)
      const paymentResponse = await authFetch('/api/payment/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          amount: total,
          orderId: newOrderId,
          callbackUrl: window.location.origin
        })
      });

      const paymentData = await safeParseJson(paymentResponse);

      if (!paymentResponse || !paymentResponse.ok) {
        if (paymentData?.errorType === 'STOCK_ERROR') {
          setStockErrors(paymentData.details || []);
          setIsLoading(false);
          return;
        }
        throw new Error(paymentData?.message || "Impossible d'initialiser le paiement Paystack");
      }

      if (paymentData?.authorization_url) {
        console.log("🔗 Redirection automatique vers Paystack:", paymentData.authorization_url);
        sessionStorage.removeItem('hdesigner_checkout_draft');
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error("L'URL de paiement Paystack est manquante.");
      }

    } catch (error: any) {
      console.error("ERREUR COMMANDE:", error);
      const msg = error.message || "Impossible de finaliser la transaction. Veuillez réessayer.";
      setOrderError(msg);
      useNotificationStore.getState().addNotification({
        title: "Problème Technique",
        message: msg,
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Pas de token : mode invité actif
      setIsGuestMode(true);
      return;
    }

    try {
      const decoded = jwtDecode<MonTokenCustom>(token);
      const userIdFromToken = decoded.userId;

      const response = await authFetch(`/api/users/${userIdFromToken}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setFormData(prev => ({
          ...prev,
          userId: userData.id || userData._id || userIdFromToken,
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          email: userData.email || '',
          phone: userData.phone || '',
          city: userData.city || '',
          address: userData.address || ''
        }));
        setIsAuth(true);
      }
    } catch (error) {
      console.error("Erreur profil", error);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const response = await authFetch('/api/loyalty/my-card');
      const data = await response.json();
      if (data.success) {
        setUserPoints(data.user.points);
      }
    } catch (error) {
      console.error("Erreur de chargement des points", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchUserProfile();
    if (token) {
      fetchUserPoints();
    }
  }, []);

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div
          className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto bg-theme-primary/10 text-theme-primary"
        >
          <Truck size={40} className="md:w-12 md:h-12" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">Votre panier est vide !</h2>
        <Link
          to="/"
          className="inline-block text-white px-6 py-3 md:px-8 md:py-3 rounded-full font-bold opacity-90 hover:opacity-100 transition shadow-lg bg-theme-primary"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  // 🛡️ OBLIGATION DE CONNEXION AVANT FINALISATION (Anti-Paiements Rejetés & Suivi Client)
  if (!isAuth && step !== 3) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white dark:bg-carbon p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-theme-primary/10 text-theme-primary">
            <Lock size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-pure">
              Connexion requise
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Pour sécuriser votre paiement Paystack, générer votre facture officielle et suivre l'expédition de votre commande, veuillez vous connecter ou créer votre compte.
            </p>
          </div>

          {/* Badge réassurance panier */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3 text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">Votre panier ({cartItems.reduce((s, i) => s + i.quantity, 0)} articles — {formatCurrency(total)}) est précieusement conservé.</span>
              <p className="opacity-90 mt-0.5">Vous reviendrez automatiquement sur cette page immédiatement après votre connexion.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/login?redirect=/checkout')}
              style={{ backgroundColor: 'var(--theme-primary)' }}
              className="w-full text-white py-4 rounded-2xl font-black text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Se connecter pour finaliser</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/login?redirect=/checkout')}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Créer un compte en 1 minute
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-12 pb-28 md:pb-12">

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-8 md:mb-16 space-x-2 md:space-x-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 text-sm md:text-base rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= s ? 'text-white shadow-lg bg-theme-primary border-theme-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500'
                }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 sm:w-16 md:w-32 h-1 mx-1 md:mx-2 rounded transition-colors ${step > s ? 'bg-theme-primary' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {step === 1 && (
            <form
              id="checkout-step1-form"
              noValidate
              onSubmit={(e) => { e.preventDefault(); handleNext(); }}
              className="bg-white dark:bg-carbon p-6 md:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors"
            >
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-pure mb-6 md:mb-8 flex items-center gap-3">
                <MapPin className="text-theme-primary" size={28} /> Détails de Livraison
              </h2>

              {/* 🚨 Alerte Globale d'Erreur dans le Formulaire */}
              {formError && (
                <div
                  className="mb-8 p-4 md:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 flex items-start gap-3.5 text-rose-900 dark:text-rose-100 shadow-sm animate-alert-shake"
                  role="alert"
                >
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <AlertCircle size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-black text-sm md:text-base">Informations incomplètes ou erronées</h4>
                    <p className="text-xs md:text-sm text-rose-700 dark:text-rose-300 mt-1 leading-relaxed font-medium">
                      {formError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-sm font-bold p-1 transition-colors"
                    title="Fermer cette alerte"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* PRÉNOM */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="prenom" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1 flex items-center justify-between">
                    <span>Prénom *</span>
                    {fieldErrors.prenom && <span className="text-rose-500 font-bold text-[11px] normal-case">Requis</span>}
                  </label>
                  <input
                    id="prenom"
                    type="text"
                    name="prenom"
                    placeholder="Votre prénom"
                    title="Votre prénom"
                    value={formData.prenom}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, prenom: e.target.value }));
                      if (fieldErrors.prenom) {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.prenom;
                          if (Object.keys(next).length === 0) setFormError(null);
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all outline-none ${
                      fieldErrors.prenom
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 text-slate-800 dark:text-pure'
                    }`}
                    aria-invalid={!!fieldErrors.prenom}
                    required
                  />
                  {fieldErrors.prenom && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-alert-shake" role="alert">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{fieldErrors.prenom}</span>
                    </p>
                  )}
                </div>

                {/* NOM */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="nom" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1 flex items-center justify-between">
                    <span>Nom *</span>
                    {fieldErrors.nom && <span className="text-rose-500 font-bold text-[11px] normal-case">Requis</span>}
                  </label>
                  <input
                    id="nom"
                    type="text"
                    name="nom"
                    placeholder="Votre nom"
                    title="Votre nom"
                    value={formData.nom}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, nom: e.target.value }));
                      if (fieldErrors.nom) {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.nom;
                          if (Object.keys(next).length === 0) setFormError(null);
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all outline-none ${
                      fieldErrors.nom
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 text-slate-800 dark:text-pure'
                    }`}
                    aria-invalid={!!fieldErrors.nom}
                    required
                  />
                  {fieldErrors.nom && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-alert-shake" role="alert">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{fieldErrors.nom}</span>
                    </p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1 flex items-center justify-between">
                    <span>Email * {isAuth && <span className="text-emerald-600 dark:text-emerald-400 font-medium normal-case">(vérifié ✓)</span>}</span>
                    {fieldErrors.email && <span className="text-rose-500 font-bold text-[11px] normal-case">Invalide</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="votre@email.com"
                      title={isAuth ? "L'email est verrouillé pour sécuriser vos commandes" : "Votre email"}
                      value={formData.email}
                      onChange={(e) => {
                        if (!isAuth) {
                          setFormData(prev => ({ ...prev, email: e.target.value }));
                          if (fieldErrors.email) {
                            setFieldErrors(prev => {
                              const next = { ...prev };
                              delete next.email;
                              if (Object.keys(next).length === 0) setFormError(null);
                              return next;
                            });
                          }
                        }
                      }}
                      readOnly={isAuth}
                      className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all outline-none ${
                        fieldErrors.email
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20'
                          : isAuth
                            ? 'bg-slate-100 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 text-slate-800 dark:text-pure'
                      }`}
                      aria-invalid={!!fieldErrors.email}
                      required
                    />
                    {isAuth && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" title="Champ vérifié et sécurisé">🔒</span>
                    )}
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-alert-shake" role="alert">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* TÉLÉPHONE */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1 flex items-center justify-between">
                    <span>Téléphone (10 chiffres) *</span>
                    {fieldErrors.phone && <span className="text-rose-500 font-bold text-[11px] normal-case">Invalide</span>}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="ex: 0701020304"
                    title="Téléphone (10 chiffres ivoiriens)"
                    value={formData.phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: clean }));
                      if (fieldErrors.phone) {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.phone;
                          if (Object.keys(next).length === 0) setFormError(null);
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all outline-none ${
                      fieldErrors.phone
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 text-slate-800 dark:text-pure'
                    }`}
                    aria-invalid={!!fieldErrors.phone}
                    required
                    maxLength={10}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-alert-shake" role="alert">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                {/* COMMUNE / ZONE */}
                <div className="md:col-span-2 space-y-1.5 text-left">
                  <label htmlFor="city" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1 flex items-center justify-between">
                    <span>Commune / Zone de Livraison (Abidjan & Intérieur) *</span>
                    {isFreeShipping && <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case text-xs">🎉 Livraison Offerte</span>}
                  </label>
                  <select
                    id="city"
                    name="city"
                    title="Sélectionnez votre commune de livraison"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, city: e.target.value }));
                      if (fieldErrors.city) {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.city;
                          if (Object.keys(next).length === 0) setFormError(null);
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all outline-none font-bold cursor-pointer ${
                      fieldErrors.city
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 text-slate-800 dark:text-pure'
                    }`}
                    aria-invalid={!!fieldErrors.city}
                    required
                  >
                    {DELIVERY_ZONES.map(zone => (
                      <option key={zone.name} value={zone.name}>
                        {zone.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.city && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-alert-shake" role="alert">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{fieldErrors.city}</span>
                    </p>
                  )}
                </div>

                {/* ADRESSE */}
                <div className="md:col-span-2 space-y-1.5 text-left">
                  <label htmlFor="address" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1 flex items-center justify-between">
                    <span>Adresse Complète (Rue, Quartier, Repère) *</span>
                    {fieldErrors.address && <span className="text-rose-500 font-bold text-[11px] normal-case">Incomplète</span>}
                  </label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    placeholder="ex: Angré 8ème Tranche, en face de la pharmacie du carrefour"
                    title="Votre adresse complète"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, address: e.target.value }));
                      if (fieldErrors.address) {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.address;
                          if (Object.keys(next).length === 0) setFormError(null);
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all outline-none ${
                      fieldErrors.address
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 text-slate-800 dark:text-pure'
                    }`}
                    aria-invalid={!!fieldErrors.address}
                    required
                  />
                  {fieldErrors.address && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-alert-shake" role="alert">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{fieldErrors.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8 md:mt-12">
                <button
                  type="submit"
                  className="w-full md:w-auto bg-slate-900 dark:bg-theme-primary text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl cursor-pointer"
                >
                  Suivant <ArrowRight size={20} />
                </button>
              </div>
            </form>
          )}

          {/* ÉTAPE 2 : PAIEMENT */}
          {step === 2 && (
            <div className="bg-white dark:bg-carbon p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in transition-colors">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center dark:text-pure">
                <CreditCard className="mr-2 w-5 h-5 md:w-6 md:h-6 text-theme-primary" /> Mode de Paiement
              </h2>

              {/* 🚨 Alerte si aucun mode de paiement sélectionné */}
              {paymentError && (
                <div
                  className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 flex items-start gap-3 text-amber-900 dark:text-amber-100 shadow-sm animate-alert-shake"
                  role="alert"
                >
                  <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left text-xs md:text-sm font-bold">
                    {paymentError}
                  </div>
                  <button type="button" onClick={() => setPaymentError(null)} className="text-amber-500 hover:text-amber-700 p-0.5" title="Fermer">✕</button>
                </div>
              )}

              <div className="space-y-3 md:space-y-4">

                <button
                  onClick={() => { setPaymentMethod('Mobile Money'); setPaymentError(null); }}
                  className={`w-full p-4 md:p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${paymentMethod === 'Mobile Money' ? 'border-theme-primary bg-theme-primary/[.05]' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm md:text-base dark:text-pure">Paiement Mobile / Carte</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['Wave', 'Orange Money', 'MTN', 'Moov', 'Carte Bancaire'].map(m => (
                        <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 ${paymentMethod === 'Mobile Money' ? 'bg-theme-primary border-theme-primary' : 'border-slate-300 dark:border-slate-600'}`}
                  />
                </button>
              </div>

              {/* --- MODULE RÉCOMPENSE VIP H-DESIGNER --- */}
              <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6 mt-6 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-slate-900 dark:bg-slate-800 text-amber-400 rounded-xl">
                    <Star size={24} className="fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-pure">Club Privilège H-Designer</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Votre solde : <strong className="text-slate-900 dark:text-pure">{userPoints} points</strong></p>
                  </div>
                </div>

                {canUsePoints ? (
                  <div
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 bg-theme-primary/[.05] border-theme-primary/20"
                  >
                    <div>
                      <p className="font-bold flex items-center gap-1 text-theme-primary">🎁 T-Shirt Offert Débloqué !</p>
                      <p className="text-xs mt-1 text-theme-primary opacity-80">Utilisez 200 points pour déduire {formatCurrency(discountAmount)} de cette commande.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                      className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap shadow-sm border ${useLoyaltyPoints
                          ? 'bg-theme-primary text-white'
                          : 'bg-white text-theme-primary border-theme-primary/20 hover:bg-slate-50'
                        }`}
                    >
                      {useLoyaltyPoints ? 'Récompense Appliquée ✓' : 'Appliquer mes points'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      Il vous manque <strong className="text-slate-800 dark:text-pure">{pointsRequired - userPoints} points</strong> pour obtenir un article gratuit.
                    </p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        ref={progressBarRef}
                        className="h-full rounded-full transition-all duration-1000 bg-theme-primary"
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 md:gap-4 mt-8">
                <button onClick={handleBack} disabled={isLoading} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 md:py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Retour</button>
                <button
                  onClick={handleNext}
                  className="flex-[2] text-white py-3 md:py-4 rounded-2xl font-bold transition-transform shadow-lg bg-theme-primary hover:opacity-95 active:scale-95 cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : RÉSUMÉ & VALIDATION */}
          {step === 3 && (
            <div className="bg-white dark:bg-carbon p-6 md:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6 md:space-y-8 animate-bounce-in transition-colors">
              <div
                className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto shadow-lg bg-theme-primary/10 text-theme-primary"
              >
                <CheckCircle2 size={40} className="md:w-16 md:h-16" />
              </div>

              {/* 🚨 Alerte en cas d'erreur de transaction ou de paiement */}
              {orderError && (
                <div
                  className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 p-5 rounded-2xl text-left animate-alert-shake shadow-sm transition-colors flex items-start gap-3.5 text-rose-900 dark:text-rose-100"
                  role="alert"
                >
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <AlertCircle size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm md:text-base">Échec lors de la transaction</h4>
                    <p className="text-xs md:text-sm text-rose-700 dark:text-rose-300 mt-1 leading-relaxed font-medium">
                      {orderError}
                    </p>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                    >
                      Réessayer la validation
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderError(null)}
                    className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-sm font-bold p-1"
                    title="Fermer cette alerte"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-4 md:p-6 text-left space-y-3 md:space-y-4 border border-slate-100 dark:border-slate-800 text-sm md:text-base transition-colors">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">Client</span>
                  <span className="font-bold text-slate-800 dark:text-pure text-right">{formData.nom} {formData.prenom}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">Email</span>
                  <span className="font-bold text-slate-800 dark:text-pure text-right truncate pl-4">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">Paiement</span>
                  <span className="font-bold text-theme-primary">Mobile Money / Carte Bancaire</span>
                </div>
              </div>

              {stockErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-5 rounded-2xl text-left animate-fade-in shadow-inner transition-colors">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-bold mb-3">
                    <AlertCircle size={20} />
                    <h4>Mise à jour de votre panier requise</h4>
                  </div>
                  <p className="text-red-600 dark:text-red-300 text-sm mb-3 font-medium">
                    Pendant que vous faisiez vos achats, un autre client a dévalisé notre stock :
                  </p>
                  <ul className="list-disc pl-6 text-red-700 dark:text-red-400 text-sm space-y-2">
                    {stockErrors.map((err, idx) => (
                      <li key={idx}>
                        <strong className="underline">{err.name}</strong><br />
                        {err.available === 0
                          ? "Définitivement épuisé 😭"
                          : `Vous en vouliez ${err.requested}, il n'en reste que ${err.available}.`}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => { navigate('/boutique'); }}
                    className="mt-4 w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Retourner à la boutique pour ajuster mon panier
                  </button>
                </div>
              )}

              {/* 🛡️ Protection Anti-Robot Turnstile pour la validation de commande */}
              <div className="text-left pt-2 pb-1">
                <ModernCaptcha
                  id="checkout-security-captcha"
                  verified={!!captchaToken}
                  onVerify={(tok) => {
                    setCaptchaToken(tok);
                    if (tok) setCaptchaError('');
                  }}
                  errorMessage={captchaError}
                />
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-4">
                <button onClick={handleBack} disabled={isLoading} className="w-full md:flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Retour
                </button>

                <div className="w-full md:flex-[2]">
                  {/* Le bouton Payer final reste volontairement en vert pour la sémantique de validation */}
                  <button
                    onClick={handleFinish}
                    disabled={isLoading || stockErrors.length > 0}
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    className="w-full text-white py-4 rounded-2xl font-black text-lg md:text-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {paymentMethod === 'Mobile Money' ? 'Redirection vers la banque...' : 'Validation...'}
                      </>
                    ) : (
                      `Payer ${formatCurrency(total)}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR - RÉSUMÉ COMMANDE */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-carbon p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative lg:sticky lg:top-6 transition-colors">
            <h3 className="text-lg font-bold mb-4 md:mb-6 flex items-center gap-2 dark:text-pure">
              <span
                className="p-2 rounded-lg bg-theme-primary/10 text-theme-primary"
              >
                <Wallet size={18} />
              </span>
              Résumé de la commande
            </h3>

            {/* LISTE DES PRODUITS */}
            <div className="space-y-4 max-h-80 md:max-h-96 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {cartItems.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="flex gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700">
                    <SafeImage
                      src={(item as any).image_url || item.image || (item.options as any)?.customizationImage}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-pure line-clamp-1 pr-2">
                        {item.name}
                      </h4>
                      <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-pure whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {item.options?.size && `Taille: ${item.options.size}`}
                      {item.options?.color && ` • ${item.options.color}`}
                    </p>

                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
                      Qté: x{item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CALCULS */}
            <div className="space-y-3 border-t border-dashed border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Sous-total</span>
                <span className="font-bold text-slate-800 dark:text-pure">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Livraison ({formData.city})</span>
                <span className="font-bold text-slate-800 dark:text-pure">
                  {shipping === 0 ? <span className="text-emerald-600 font-bold">Gratuite 🎉</span> : formatCurrency(shipping)}
                </span>
              </div>
            </div>

            {/* TOTAL FINAL */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-base md:text-lg font-bold text-slate-900 dark:text-pure">Total à payer</span>
              <span className="text-xl md:text-2xl font-black text-theme-primary">{formatCurrency(total)}</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] md:text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 py-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <Lock size={12} />
              Paiement 100% sécurisé par Paystack
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
};

export default Checkout;