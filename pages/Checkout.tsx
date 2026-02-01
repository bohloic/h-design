import React, { useState, useEffect } from 'react';
import { authFetch } from '../src/utils/apiClient';
import { CreditCard, MapPin, CheckCircle2, ArrowRight, Wallet, Lock, Truck, Loader2 } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

// On a supprimé l'import de PaymentButton ici car on ne l'utilise plus !

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
  // On accepte 'Mobile Money', 'Carte' ou 'Espèces'
  const [paymentMethod, setPaymentMethod] = useState<'Carte' | 'Espèces' | 'Mobile Money' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  const [formData, setFormData] = useState({
    userId: data?.id || '',
    nom: data?.nom || '',
    prenom: data?.prenom || '',
    address: data?.address || '',
    phone: data?.phone || '',
    email: data?.email || '',
    city: data?.city || ''
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50000 ? 0 : 3000;
  const total = subtotal + shipping;

  // --- NAVIGATION ---
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

  const handleBack = () => setStep(step - 1);

  // --- LOGIQUE PRINCIPALE DE COMMANDE & PAIEMENT ---
  const handleFinish = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Vous devez être connecté pour finaliser la commande.");
        navigate('/login');
        return;
    }

    setIsLoading(true);

    try {
        // 1. CRÉATION DE LA COMMANDE (Avant le paiement)
        const URL_ORDER = '/api/orders'; 
        const orderResponse = await authFetch(URL_ORDER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: formData.userId, // Ajout explicite pour éviter l'erreur 500
                cartItems: cartItems,
                shippingDetails: formData,
                paymentMethod: paymentMethod, 
                totalAmount: total
            })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(orderData.message || "Erreur lors de la création de la commande");
        }

        const newOrderId = orderData.orderId; // L'ID de la commande créée par la BDD

        // 2. GESTION DU PAIEMENT
        if (paymentMethod === 'Espèces') {
            // CAS A : Paiement à la livraison
            alert("Commande confirmée ! Un lutin livreur est en route 🎅");
            onClearCart();
            navigate('/order-confirmed', { state: { orderId: newOrderId } });

        } else {
            // CAS B : Paiement Électronique (Paystack)
            const paymentResponse = await authFetch('/api/payment/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: formData.email,
                    amount: total,
                    orderId: newOrderId // On passe l'ID de commande à Paystack
                })
            });

            const paymentData = await paymentResponse.json();

            if (paymentData.authorization_url) {
                // Redirection vers la page de paiement Paystack
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

  // --- CHARGEMENT PROFIL ---
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
          userId: userData.id || userData._id || userIdFromToken, // Fallback sur le token si pas d'ID
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

  useEffect(() => {
    fetchUserProfile();
  }, []); 

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <Truck size={40} className="md:w-12 md:h-12" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">Votre traineau est vide !</h2>
        <Link to="/" className="inline-block bg-red-600 text-white px-6 py-3 md:px-8 md:py-3 rounded-full font-bold hover:bg-red-700 transition">
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
            <div className={`w-8 h-8 md:w-10 md:h-10 text-sm md:text-base rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              step >= s ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-8 sm:w-16 md:w-32 h-1 mx-1 md:mx-2 rounded ${step > s ? 'bg-red-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* ÉTAPE 1 : INFOS */}
          {step === 1 && (
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
                <MapPin className="mr-2 text-red-600 w-5 h-5 md:w-6 md:h-6" /> Informations de livraison
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Nom</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm md:text-base" 
                    value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Prénom</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm md:text-base" 
                    value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600">Ville</label>
                   <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm md:text-base"/>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600">Adresse</label>
                   <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm md:text-base"/>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600">Téléphone</label>
                   <input type="text" inputMode="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm md:text-base"/>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-600">Email</label>
                   <input type="email" inputMode="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                   className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm md:text-base" readOnly={isAuth}/>
                </div>

              </div>
              <button onClick={handleNext} className="mt-8 w-full bg-red-600 text-white py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95">
                <span>Continuer vers le paiement</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : PAIEMENT */}
          {step === 2 && (
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center">
                <CreditCard className="mr-2 text-red-600 w-5 h-5 md:w-6 md:h-6" /> Mode de Paiement
              </h2>
              <div className="space-y-3 md:space-y-4">
                
                {/* Option Paystack (Mobile Money / Carte) */}
                <button 
                    onClick={() => setPaymentMethod('Mobile Money')}
                    className={`w-full p-4 md:p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                    paymentMethod === 'Mobile Money' ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                >
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm md:text-base">Paiement en ligne</span>
                        <span className="text-xs text-slate-500">Mobile Money (Orange, MTN, Moov, Wave) & Carte</span>
                    </div>
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 ${paymentMethod === 'Mobile Money' ? 'bg-red-600 border-red-600' : 'border-slate-300'}`} />
                </button>

                {/* Option Espèces */}
                <button 
                    onClick={() => setPaymentMethod('Espèces')}
                    className={`w-full p-4 md:p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                    paymentMethod === 'Espèces' ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                >
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm md:text-base">Paiement à la livraison</span>
                        <span className="text-xs text-slate-500">Payer en espèces à la réception</span>
                    </div>
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 ${paymentMethod === 'Espèces' ? 'bg-red-600 border-red-600' : 'border-slate-300'}`} />
                </button>

              </div>

              <div className="flex gap-3 md:gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 bg-slate-100 text-slate-600 py-3 md:py-4 rounded-2xl font-bold hover:bg-slate-200">Retour</button>
                <button onClick={handleNext} disabled={!paymentMethod} className="flex-[2] bg-red-600 text-white py-3 md:py-4 rounded-2xl font-bold disabled:opacity-50 active:scale-95 transition-transform">Confirmer</button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : RÉSUMÉ & VALIDATION */}
          {step === 3 && (
            <div className="bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6 md:space-y-8 animate-bounce-in">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                <CheckCircle2 size={40} className="md:w-16 md:h-16" />
              </div>
              
              <div className="bg-slate-50 rounded-3xl p-4 md:p-6 text-left space-y-3 md:space-y-4 border border-slate-100 text-sm md:text-base">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-xs">Client</span>
                  <span className="font-bold text-slate-800 text-right">{formData.nom} {formData.prenom}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-bold uppercase text-xs">Email</span>
                    <span className="font-bold text-slate-800 text-right truncate pl-4">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-xs">Paiement</span>
                  <span className="font-bold text-red-600">{paymentMethod === 'Mobile Money' ? 'Mobile Money / Carte' : paymentMethod}</span>
                </div>
              </div>
              
              <div className="flex flex-col-reverse md:flex-row gap-4">
                  <button onClick={handleBack} disabled={isLoading} className="w-full md:flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200">
                    Retour
                  </button>
                  
                  <div className="w-full md:flex-[2]">
                    <button 
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg md:text-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" /> 
                                {paymentMethod === 'Mobile Money' ? 'Redirection Paystack...' : 'Validation...'}
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
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 relative lg:sticky lg:top-6">
            <h3 className="text-lg font-bold mb-4 md:mb-6 flex items-center gap-2">
              <span className="bg-red-100 text-red-600 p-2 rounded-lg">
                <Wallet size={18} />
              </span>
              Résumé de la commande
            </h3>

            {/* LISTE DES PRODUITS */}
            <div className="space-y-4 max-h-80 md:max-h-96 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {cartItems.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                    <img 
                      src={BASE_IMG_URL + item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs md:text-sm text-slate-800 line-clamp-1 pr-2">
                        {item.name}
                      </h4>
                      <span className="font-bold text-xs md:text-sm text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {item.options?.size && `Taille: ${item.options.size}`}
                      {item.options?.color && ` • ${item.options.color}`}
                    </p>

                    <div className="text-xs font-bold text-slate-400 mt-1">
                      Qté: x{item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CALCULS */}
            <div className="space-y-3 border-t border-dashed border-slate-200 pt-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-slate-500">
                <span>Livraison</span>
                <span className={`font-bold ${shipping === 0 ? 'text-green-600' : 'text-slate-800'}`}>
                  {shipping === 0 ? "Gratuite" : formatCurrency(shipping)}
                </span>
              </div>
            </div>

            {/* TOTAL FINAL */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              <span className="text-base md:text-lg font-bold text-slate-900">Total à payer</span>
              <span className="text-xl md:text-2xl font-black text-red-600">{formatCurrency(total)}</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] md:text-xs text-slate-400 bg-slate-50 py-3 rounded-xl">
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