
import React, { useState } from 'react';
import { CreditCard, Truck, MapPin, CheckCircle2, ArrowLeft, ArrowRight, Wallet, Banknote, Star } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../constants';
import { Link, useNavigate } from 'react-router-dom';

interface CheckoutProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, onClearCart }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Carte' | 'Espèces' | 'Mobile Money' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    city: ''
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50000 ? 0 : 3000;
  const total = subtotal + shipping;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFinish = () => {
    alert("Commande confirmée ! Un lutin livreur est en route.");
    onClearCart();
    navigate('/dashboard');
  };

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <Truck size={48} />
        </div>
        <h2 className="text-2xl font-bold">Votre traineau est vide !</h2>
        <p className="text-slate-500">Ajoutez des cadeaux avant de passer à la caisse.</p>
        <Link to="/boutique" className="inline-block bg-red-600 text-white px-8 py-3 rounded-full font-bold">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-16 space-x-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              step >= s ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-16 md:w-32 h-1 mx-2 rounded ${
                step > s ? 'bg-red-600' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {step === 1 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <MapPin className="mr-2 text-red-600" /> Informations de livraison
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Nom Complet</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Jean Kouassi" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600/20"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: +225 01010101" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600/20"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-600">Adresse Exacte</label>
                  <textarea 
                    rows={3}
                    placeholder="Rue, Quartier, Repère..." 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600/20"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Ville</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Abidjan" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600/20"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Email (Optionnel)</label>
                  <input 
                    type="email" 
                    placeholder="jean@exemple.com" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600/20"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <button 
                onClick={handleNext}
                className="mt-10 w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-red-700 transition-all shadow-xl shadow-red-100"
              >
                <span>Continuer vers le paiement</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <CreditCard className="mr-2 text-red-600" /> Mode de Paiement
              </h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setPaymentMethod('Mobile Money')}
                  className={`w-full p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                    paymentMethod === 'Mobile Money' ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                      <Wallet size={32} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Mobile Money</p>
                      <p className="text-sm text-slate-500">Orange Money, Wave, MTN, Moov</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${paymentMethod === 'Mobile Money' ? 'bg-red-600 border-red-600' : 'border-slate-300'}`} />
                </button>

                <button 
                  onClick={() => setPaymentMethod('Carte')}
                  className={`w-full p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                    paymentMethod === 'Carte' ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                      <CreditCard size={32} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Carte Bancaire</p>
                      <p className="text-sm text-slate-500">Visa, Mastercard</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${paymentMethod === 'Carte' ? 'bg-red-600 border-red-600' : 'border-slate-300'}`} />
                </button>

                <button 
                  onClick={() => setPaymentMethod('Espèces')}
                  className={`w-full p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${
                    paymentMethod === 'Espèces' ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                      <Banknote size={32} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Paiement à la livraison</p>
                      <p className="text-sm text-slate-500">Payez en espèces à réception</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${paymentMethod === 'Espèces' ? 'bg-red-600 border-red-600' : 'border-slate-300'}`} />
                </button>
              </div>

              <div className="flex space-x-4 mt-10">
                <button 
                  onClick={handleBack}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-200 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Retour</span>
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!paymentMethod}
                  className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50"
                >
                  <span>Confirmer le mode de paiement</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center space-y-8 animate-bounce-in">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                <CheckCircle2 size={64} />
              </div>
              <div>
                <h2 className="text-3xl font-black mb-2">Presque terminé !</h2>
                <p className="text-slate-500 max-w-sm mx-auto">Veuillez vérifier le récapitulatif de votre commande de Noël avant la validation finale.</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-xs">Client</span>
                  <span className="font-bold">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-xs">Livraison</span>
                  <span className="font-bold">{formData.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-xs">Paiement</span>
                  <span className="font-bold text-red-600">{paymentMethod}</span>
                </div>
              </div>
              <button 
                onClick={handleFinish}
                className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-100"
              >
                Passer ma commande {formatCurrency(total)}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6">Récapitulatif</h3>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="flex space-x-3">
                  <img src={item.image} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">Qté: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-6 border-t border-slate-50">
              <div className="flex justify-between text-slate-500">
                <span>Sous-total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Livraison</span>
                <span className={shipping === 0 ? 'text-green-600 font-bold' : ''}>
                  {shipping === 0 ? 'Gratuite' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-black text-red-600 pt-3 border-t">
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center">
             <p className="text-red-600 font-bold flex items-center justify-center mb-2">
                <Star className="w-4 h-4 mr-2 fill-red-600" /> +{Math.floor(total / 100)} points de fidélité
             </p>
             <p className="text-xs text-red-500">Gagnez des points sur chaque achat et transformez-les en cadeaux !</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
