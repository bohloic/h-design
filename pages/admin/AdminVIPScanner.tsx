import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { authFetch } from '../../src/utils/apiClient'; // Ajuste le chemin si besoin
import { Search, User, Star, Gift, AlertTriangle, CheckCircle2, Camera } from 'lucide-react';

export const AdminVIPScanner = () => {
    const [manualEmail, setManualEmail] = useState('');
    const [scannedUser, setScannedUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [confirmRedeem, setConfirmRedeem] = useState(false);

    // Fonction appelée quand la caméra détecte un QR Code
    const handleScan = async (result: string) => {
        if (result) {
            setShowCamera(false); // On coupe la caméra
            try {
                // Le QR code contient un JSON : {"userId": 1, "type": "GLAMS_VIP_CARD"...}
                const data = JSON.parse(result);
                if (data.userId) {
                    fetchUserLoyalty(data.userId, 'id');
                }
            } catch (e) {
                setError("QR Code non reconnu ou invalide.");
            }
        }
    };

    // Fonction pour chercher le client (soit par ID du QR code, soit par Email manuel)
    const fetchUserLoyalty = async (identifier: string | number, type: 'id' | 'email') => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        setScannedUser(null);
        setConfirmRedeem(false);

        try {
            // Note : Nous allons créer cette route backend juste après !
            const response = await authFetch(`/api/admin/loyalty/scan?${type}=${identifier}`);
            if (!response.ok) throw new Error("Client introuvable.");
            
            const data = await response.json();
            setScannedUser(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour valider le T-shirt offert et retirer 200 points
    const handleRedeemPoints = async () => {
        if (!confirmRedeem) {
            setConfirmRedeem(true);
            setTimeout(() => setConfirmRedeem(false), 4000);
            return;
        }

        setConfirmRedeem(false);
        setLoading(true);
        try {
            // Note : Nous allons aussi créer cette route backend
            const response = await authFetch(`/api/admin/loyalty/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: scannedUser.id, pointsToDeduct: 200 })
            });

            if (!response.ok) throw new Error("Erreur lors de la déduction.");
            
            setSuccessMessage("Récompense validée ! 200 points ont été déduits.");
            // Mise à jour de l'affichage local
            setScannedUser({ ...scannedUser, loyalty_points: scannedUser.loyalty_points - 200 });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            {/* HEADER */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-2xl">
                    <Star size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Scanner VIP H-Designer</h2>
                    <p className="text-slate-500 text-sm mt-1">Identifiez le client et appliquez ses récompenses.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLONNE GAUCHE : RECHERCHE & SCAN */}
                <div className="space-y-6">
                    {/* Option 1 : Caméra */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {/* 🪄 COULEUR DYNAMIQUE ICI */}
                            <Camera style={{ color: 'var(--theme-primary)' }} /> Scanner le QR Code
                        </h3>
                        {showCamera ? (
                            <div className="rounded-2xl overflow-hidden border-4 border-slate-900 relative">
                                <Scanner 
                                    onScan={(result: any) => {
                                        const text = Array.isArray(result) ? result[0]?.rawValue : result;
                                        if (text) handleScan(text);
                                    }} 
                                    onError={(error: any) => console.log(error?.message)}
                                />
                                <button 
                                    onClick={() => setShowCamera(false)}
                                    // 🪄 COULEUR DYNAMIQUE ICI
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg opacity-90 hover:opacity-100 transition-opacity"
                                >
                                    Fermer la caméra
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowCamera(true)}
                                className="w-full py-8 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors text-slate-600"
                            >
                                <Camera size={32} />
                                <span className="font-bold">Activer la caméra</span>
                            </button>
                        )}
                    </div>

                    {/* Option 2 : Manuel */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {/* 🪄 COULEUR DYNAMIQUE ICI */}
                            <Search style={{ color: 'var(--theme-primary)' }} /> Saisie manuelle
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="Email du client..." 
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                // 🪄 OUTLINE DYNAMIQUE ICI : On ajoute du style in-line pour focus
                                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                                className="flex-1 p-3 rounded-xl border border-slate-200 outline-none transition-all focus:ring-2"
                            />
                            <button 
                                onClick={() => fetchUserLoyalty(manualEmail, 'email')}
                                disabled={!manualEmail || loading}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                                Chercher
                            </button>
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : RÉSULTAT */}
                <div>
                    {loading && <p className="text-center text-slate-500 font-bold animate-pulse mt-10">Recherche en cours...</p>}
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertTriangle /> <span className="font-bold">{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 flex items-center gap-3 mb-4">
                            <CheckCircle2 /> <span className="font-bold">{successMessage}</span>
                        </div>
                    )}

                    {scannedUser && (
                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 border-t-4 border-t-slate-900 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase">{scannedUser.prenom} {scannedUser.nom}</h3>
                                    <p className="text-slate-500">{scannedUser.email}</p>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Solde Actuel</p>
                                <p className="text-5xl font-black text-slate-900 flex items-center justify-center gap-2">
                                    {scannedUser.loyalty_points} <Star className="text-amber-400 fill-amber-400" size={40}/>
                                </p>
                            </div>

                            {/* LOGIQUE DE RÉCOMPENSE (200 points = T-shirt offert) */}
                            {scannedUser.loyalty_points >= 200 ? (
                                // 🪄 BACKGROUND DYNAMIQUE ICI
                                <div 
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                    className="p-6 rounded-2xl text-white text-center shadow-lg"
                                >
                                    <Gift size={40} className="mx-auto mb-3" />
                                    <h4 className="font-black text-xl mb-1">T-Shirt Offert Débloqué !</h4>
                                    <p className="text-sm text-white/80 mb-6">Le client a atteint le palier des 200 points.</p>
                                    <button 
                                        onClick={handleRedeemPoints}
                                        // 🪄 TEXTE DYNAMIQUE ICI POUR RESTER COHÉRENT
                                        style={{ color: 'var(--theme-primary)' }}
                                        className={`w-full py-3 rounded-xl font-black uppercase tracking-wide transition-colors active:scale-95 select-none ${confirmRedeem ? 'bg-red-500 text-white border-2 border-red-500 shadow-xl scale-105' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        {confirmRedeem ? "Taper pour Confirmer (!)" : "Valider la gratuité"}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                                    <p className="font-bold text-slate-600">Points insuffisants pour un article gratuit.</p>
                                    <p className="text-sm text-slate-400 mt-1">Il manque {200 - scannedUser.loyalty_points} points.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};