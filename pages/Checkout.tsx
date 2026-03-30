import React, { useState, useEffect } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { CreditCard, MapPin, CheckCircle2, ArrowRight, Wallet, Lock, Truck, Loader2, Star, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import { usePaymentStore } from '@/src/store/usePaymentStore';

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
const Checkout: React.FC<CheckoutProps> = ({ cartItems, onClearCart, data }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const preferredPaymentMethod = usePaymentStore(state => state.preferredMethod);
  const [paymentMethod, setPaymentMethod] = useState<'Carte' | 'Espèces' | 'Mobile Money' | null>(preferredPaymentMethod);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [userPoints, setUserPoints] = useState<number>(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);
  
  const [stockErrors, setStockErrors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    userId: data?.id || '',
    nom: data?.nom || '',
    prenom: data?.prenom || '',
    address: data?.address || '',
    phone: data?.phone || '',
    email: data?.email || '',
    city: data?.city || ''
  });
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
        city: data.city || prev.city
      }));
    }
  }, [data]);
  const pointsRequired = 200;
  const canUsePoints = userPoints >= pointsRequired;
  const discountAmount = useLoyaltyPoints && cartItems.length > 0 ? cartItems[0].price : 0;
  
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50000 ? 0 : 3000;
  const total = subtotal + shipping - discountAmount;

  const handleNext = () => {
    if (step === 1) {
      if (!formData.nom || !formData.prenom || !formData.address || !formData.phone || !formData.city) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
      }
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStockErrors([]); 
    setStep(step - 1);
  };

  const handleFinish = async () => {
    const token = localStorage.getItem('token');
    
    // MODE INVITÉ : pas de token requis si l'email est fourni
    if (!token) {
        if (!formData.email || !formData.nom) {
            alert("Veuillez fournir votre nom et email pour continuer.");
            return;
        }
        // On continue en mode invité (userId = null)
    }

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

    try {
        const URL_ORDER = '/api/orders'; 
        const orderResponse = await authFetch(URL_ORDER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: finalUserId,
                cartItems: cartItems,
                shippingDetails: formData,
                paymentMethod: paymentMethod, 
                totalAmount: total,
                useLoyaltyPoints: useLoyaltyPoints
            })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(orderData.message || "Erreur lors de la création de la commande");
        }

        const newOrderId = orderData.orderId;

        if (paymentMethod === 'Espèces') {
            alert("Commande confirmée ! Un livreur est en route 🚚");
            onClearCart();
            navigate('/order-confirmed', { state: { orderId: newOrderId } });

        } else {
            const paymentResponse = await authFetch('/api/payment/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: formData.email,
                    amount: total,
                    orderId: newOrderId
                })
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                if (paymentData.errorType === 'STOCK_ERROR') {
                    setStockErrors(paymentData.details);
                    setIsLoading(false);
                    return; 
                }
                throw new Error(paymentData.message || "Impossible d'initialiser le paiement Paystack");
            }

            if (paymentData.authorization_url) {
                window.location.href = paymentData.authorization_url;
            } else {
                throw new Error("Impossible d'initialiser le paiement Paystack");
            }
        }

    } catch (error: any) {
        console.error("ERREUR COMMANDE:", error);
        alert("Oups ! Problème technique : " + error.message);
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
    fetchUserProfile();
    fetchUserPoints(); 
  }, []); 

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' }}
        >
          <Truck size={40} className="md:w-12 md:h-12" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">Votre panier est vide !</h2>
        <Link 
            to="/" 
            style={{ backgroundColor: 'var(--theme-primary)' }}
            className="inline-block text-white px-6 py-3 md:px-8 md:py-3 rounded-full font-bold opacity-90 hover:opacity-100 transition shadow-lg"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-12">
      
      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-8 md:mb-16 space-x-2 md:space-x-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div 
                className={`w-8 h-8 md:w-10 md:h-10 text-sm md:text-base rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                    step >= s ? 'text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500'
                }`}
                style={step >= s ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
            >
              {s}
            </div>
            {s < 3 && (
              <div 
                  className={`w-8 sm:w-16 md:w-32 h-1 mx-1 md:mx-2 rounded transition-colors ${step > s ? '' : 'bg-slate-200'}`} 
                  style={step > s ? { backgroundColor: 'var(--theme-primary)' } : {}}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* ÉTAPE 1 : INFOS */}
          {step === 1 && (
            <div className="bg-white dark:bg-carbon p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in transition-colors">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center dark:text-pure">
                <MapPin className="mr-2 w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--theme-primary)' }} /> Informations de livraison
              </h2>

              {/* 🛍️ BANNIÈRE MODE INVITÉ */}
              {isGuestMode && (
                <div className="mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 justify-between" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)' }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--theme-primary)' }}>👤 Vous commandez en tant qu'invité</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Remplissez votre email pour recevoir la confirmation de commande.</p>
                  </div>
                  <Link to="/login" state={{ from: { pathname: '/checkout' } }} className="text-xs font-black whitespace-nowrap px-3 py-2 rounded-xl transition-all" style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}>
                    Se connecter
                  </Link>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Nom</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-pure text-sm md:text-base transition-all theme-input" 
                    value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Prénom</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-pure text-sm md:text-base transition-all theme-input" 
                    value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Ville</label>
                   <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-pure text-sm md:text-base transition-all theme-input"/>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Adresse complète</label>
                   <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-pure text-sm md:text-base transition-all theme-input"/>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Téléphone</label>
                   <input type="text" inputMode="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-pure text-sm md:text-base transition-all theme-input"/>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Email</label>
                   <input type="email" inputMode="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-pure text-sm md:text-base transition-all theme-input" readOnly={isAuth}/>
                </div>

              </div>
              <button 
                onClick={handleNext} 
                style={{ backgroundColor: 'var(--theme-primary)' }}
                className="mt-8 w-full text-white py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 opacity-95 hover:opacity-100 transition-all shadow-xl active:scale-95"
              >
                <span>Continuer vers le paiement</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : PAIEMENT */}
          {step === 2 && (
            <div className="bg-white dark:bg-carbon p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in transition-colors">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center dark:text-pure">
                <CreditCard className="mr-2 w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--theme-primary)' }} /> Mode de Paiement
              </h2>
              <div className="space-y-3 md:space-y-4">
                
                {/* Option Paystack (Wave / Orange / MTN / Moov / Carte) */}
                <button 
                    onClick={() => setPaymentMethod('Mobile Money')}
                    style={paymentMethod === 'Mobile Money' ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' } : {}}
                    className={`w-full p-4 md:p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                        paymentMethod === 'Mobile Money' ? '' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
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
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 ${paymentMethod === 'Mobile Money' ? '' : 'border-slate-300 dark:border-slate-600'}`} 
                        style={paymentMethod === 'Mobile Money' ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
                    />
                </button>

                {/* Option Espèces */}
                <button 
                    onClick={() => setPaymentMethod('Espèces')}
                    style={paymentMethod === 'Espèces' ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' } : {}}
                    className={`w-full p-4 md:p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                        paymentMethod === 'Espèces' ? '' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm md:text-base dark:text-pure">Paiement à la livraison</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Payer en espèces à la réception</span>
                    </div>
                    <div 
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 ${paymentMethod === 'Espèces' ? '' : 'border-slate-300 dark:border-slate-600'}`} 
                        style={paymentMethod === 'Espèces' ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}
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
                          className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                      >
                          <div>
                              <p className="font-bold flex items-center gap-1" style={{ color: 'var(--theme-primary)' }}>🎁 T-Shirt Offert Débloqué !</p>
                              <p className="text-xs mt-1" style={{ color: 'var(--theme-primary)', opacity: 0.8 }}>Utilisez 200 points pour déduire {discountAmount.toLocaleString()} FCFA de cette commande.</p>
                          </div>
                          
                          <button 
                              type="button"
                              onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                              style={useLoyaltyPoints ? { backgroundColor: 'var(--theme-primary)', color: 'white' } : { backgroundColor: 'white', color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
                              className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap shadow-sm border ${
                                  useLoyaltyPoints 
                                  ? '' 
                                  : 'hover:bg-slate-50'
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
                                  className="h-full rounded-full transition-all duration-1000" 
                                  style={{ width: `${Math.min(100, (userPoints / pointsRequired) * 100)}%`, backgroundColor: 'var(--theme-primary)' }}
                              ></div>
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex gap-3 md:gap-4 mt-8">
                <button onClick={handleBack} disabled={isLoading} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 md:py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Retour</button>
                <button 
                    onClick={handleNext} 
                    disabled={!paymentMethod} 
                    style={paymentMethod ? { backgroundColor: 'var(--theme-primary)' } : {}}
                    className={`flex-[2] text-white py-3 md:py-4 rounded-2xl font-bold transition-transform ${paymentMethod ? 'opacity-95 hover:opacity-100 active:scale-95 shadow-lg' : 'bg-slate-300 cursor-not-allowed'}`}
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
                  className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' }}
              >
                <CheckCircle2 size={40} className="md:w-16 md:h-16" />
              </div>
              
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
                  <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{paymentMethod === 'Mobile Money' ? 'Mobile Money / Carte' : paymentMethod}</span>
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
                                  <strong className="underline">{err.name}</strong><br/>
                                  {err.available === 0 
                                      ? "Définitivement épuisé 😭" 
                                      : `Vous en vouliez ${err.requested}, il n'en reste que ${err.available}.`}
                              </li>
                          ))}
                      </ul>
                      <button 
                          onClick={() => { navigate('/cart'); }} 
                          className="mt-4 w-full bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                          Modifier mon panier
                      </button>
                  </div>
              )}
              
              <div className="flex flex-col-reverse md:flex-row gap-4">
                  <button onClick={handleBack} disabled={isLoading} className="w-full md:flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Retour
                  </button>
                  
                  <div className="w-full md:flex-[2]">
                    {/* Le bouton Payer final reste volontairement en vert pour la sémantique de validation */}
                    <button 
                        onClick={handleFinish}
                        disabled={isLoading || stockErrors.length > 0} 
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg md:text-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' }}
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
                    <img 
                      src={BASE_IMG_URL + item.image} 
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
                <span>Livraison</span>
                <span className={`font-bold ${shipping === 0 ? 'text-green-600 dark:text-green-500' : 'text-slate-800 dark:text-pure'}`}>
                  {shipping === 0 ? "Gratuite" : formatCurrency(shipping)}
                </span>
              </div>
            </div>

            {/* TOTAL FINAL */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-base md:text-lg font-bold text-slate-900 dark:text-pure">Total à payer</span>
              <span className="text-xl md:text-2xl font-black" style={{ color: 'var(--theme-primary)' }}>{formatCurrency(total)}</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] md:text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 py-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <Lock size={12} />
              Paiement 100% sécurisé par Paystack
            </div>
          </div>
        </aside>
      </div>

      {/* 🪄 STYLES MAGIQUES POUR LES INPUTS */}
      <style>{`
        .theme-input:focus {
            background-color: white !important;
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 15%, transparent) !important;
        }
      `}</style>
    </div>
  );
};

export default Checkout;