import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Store, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { authFetch } from '../../src/utils/apiClient';
import { jwtDecode } from 'jwt-decode';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import { useAuth } from '../../src/utils/context/AuthContext';

interface MonTokenCustom {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    city: '',
    address: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Non connecté");

      const decoded = jwtDecode<MonTokenCustom>(token);
      const IdFromToken = decoded.userId;
      setUserId(IdFromToken);

      const response = await authFetch(`/api/users/${IdFromToken}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération du profil");
      
      const data = await response.json();
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Impossible de charger votre profil." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await authFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Échec de la sauvegarde");
      
        setMessage({ type: 'success', text: "Vos informations ont été mises à jour avec succès !" });
        
        // 🔄 Sync Global State
        updateUser(formData);

        useNotificationStore.getState().addNotification({
        userId: userId || undefined,
        title: "Profil mis à jour",
        message: "Vos informations personnelles ont été enregistrées avec succès.",
        type: "success",
        link: "/dashboard/settings"
      });
    } catch (error) {
      setMessage({ type: 'error', text: "Une erreur est survenue lors de l'enregistrement." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
        setMessage({ type: 'error', text: "Votre adresse email est requise pour cette action." });
        return;
    }
    
    setIsResettingPassword(true);
    setMessage(null);

    try {
      const response = await authFetch(`/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: "Un email de réinitialisation vous a été envoyé avec succès !" });
      } else {
        throw new Error(data.message || "Erreur lors de l'envoi de l'email.");
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Erreur technique lors de la demande." });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-white/5 mb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-pure flex items-center gap-2 transition-colors">
            <User className="text-slate-400" /> Profil Personnel
          </h2>
          <button 
            type="submit" 
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-xl flex items-center gap-2 font-medium text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <Loader2 size={40} className="animate-spin text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-500">Chargement de votre profil...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Prénom</label>
                <input type="text" name="prenom" required value={formData.prenom} onChange={handleChange} className="w-full text-sm font-medium bg-slate-50 dark:bg-[#202022] dark:text-pure border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition-shadow" placeholder="Votre prénom" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nom</label>
                <input type="text" name="nom" required value={formData.nom} onChange={handleChange} className="w-full text-sm font-medium bg-slate-50 dark:bg-[#202022] dark:text-pure border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition-shadow" placeholder="Votre nom" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Adresse Email</label>
                <input type="email" name="email" value={formData.email} readOnly className="w-full text-sm font-medium bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none" placeholder="votre@email.com" title="L'adresse email ne peut pas être modifiée" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Téléphone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full text-sm font-medium bg-slate-50 dark:bg-[#202022] dark:text-pure border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition-shadow" placeholder="Ex: 01 23 45 67 89" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ville</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full text-sm font-medium bg-slate-50 dark:bg-[#202022] dark:text-pure border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition-shadow" placeholder="Ex: Abidjan" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Adresse détaillée</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full text-sm font-medium bg-slate-50 dark:bg-[#202022] dark:text-pure border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition-shadow" placeholder="Ex: Rue des jardins, porte 12" />
              </div>
            </div>
          </div>
        )}
      </form>

      <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-white/5 mb-6 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-pure flex items-center gap-2 mb-6 transition-colors">
          <Lock className="text-slate-400" /> Sécurité
        </h2>
        <p className="text-sm text-slate-500 mb-4">Pour protéger votre compte, le changement de mot de passe se fait via un lien sécurisé envoyé à votre adresse email ({formData.email || 'non renseigné'}).</p>
        <button 
          type="button" 
          onClick={handlePasswordReset} 
          disabled={isResettingPassword || !formData.email}
          className="text-sm font-bold text-slate-700 dark:text-pure bg-slate-100 dark:bg-[#202022] px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border dark:border-white/5"
        >
          {isResettingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
          M'envoyer le lien de réinitialisation
        </button>
      </div>
      
      <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-white/5 opacity-60 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-pure flex items-center gap-2 mb-6 transition-colors">
          <Bell className="text-slate-400" /> Notifications
        </h2>
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-pure transition-colors">Offres promotionnelles</h4>
            <p className="text-xs text-slate-500">Recevez nos meilleures offres par email</p>
          </div>
          <div className="w-12 h-6 bg-green-500 rounded-full cursor-pointer relative transition-colors duration-200 ease-in-out" onClick={() => alert('À venir')}>
            <div className="absolute left-[26px] top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ease-in-out shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
