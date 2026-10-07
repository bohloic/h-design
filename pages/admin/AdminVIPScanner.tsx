import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { authFetch } from '../../src/utils/apiClient';
import { Search, User, Star, Gift, AlertTriangle, CheckCircle2, Camera, Upload, X } from 'lucide-react';

export const AdminVIPScanner = () => {
    const [manualEmail, setManualEmail] = useState('');
    const [scannedUser, setScannedUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [confirmRedeem, setConfirmRedeem] = useState(false);

    // ⌨️ FERMETURE CAMÉRA AVEC LA TOUCHE ÉCHAP
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showCamera) {
                setShowCamera(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showCamera]);

    // Fonction appelée quand la caméra détecte un QR Code
    const handleScan = async (result: string) => {
        if (result) {
            setShowCamera(false);
            try {
                const data = typeof result === 'string' && result.startsWith('{') ? JSON.parse(result) : { userId: result };
                if (data.userId) {
                    fetchUserLoyalty(data.userId, 'id');
                } else {
                    fetchUserLoyalty(result, 'email');
                }
            } catch (e) {
                // Fallback si la chaîne brute est un email ou un ID
                fetchUserLoyalty(result, 'email');
            }
        }
    };

    // 📁 Gestion du téléversement d'image QR Code en fallback
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                // Si le navigateur le supporte, tenter de décoder via BarcodeDetector natif
                if ('BarcodeDetector' in window) {
                    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                    detector.detect(canvas)
                        .then((barcodes: any[]) => {
                            if (barcodes.length > 0) {
                                handleScan(barcodes[0].rawValue);
                            } else {
                                setError("Aucun QR Code valide détecté dans l'image. Utilisez la saisie manuelle.");
                            }
                        })
                        .catch(() => {
                            setError("Impossible de décoder l'image. Entrez l'email du client ci-dessous.");
                        });
                } else {
                    setError("Le décodage d'image nécessite Chrome/Safari moderne. Veuillez entrer l'email du client ci-dessous.");
                }
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Fonction pour chercher le client (soit par ID du QR code, soit par Email manuel)
    const fetchUserLoyalty = async (identifier: string | number, type: 'id' | 'email') => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        setScannedUser(null);
        setConfirmRedeem(false);

        try {
            const response = await authFetch(`/api/admin/loyalty/scan?${type}=${encodeURIComponent(identifier)}`);
            if (!response.ok) throw new Error("Client introuvable.");
            
            const data = await response.json();
            setScannedUser(data);
        } catch (err: any) {
            setError(err.message || "Impossible de localiser ce client.");
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour valider la récompense
    const handleRedeemPoints = async () => {
        if (!confirmRedeem) {
            setConfirmRedeem(true);
            setTimeout(() => setConfirmRedeem(false), 4000);
            return;
        }

        setConfirmRedeem(false);
        setLoading(true);
        try {
            const response = await authFetch(`/api/admin/loyalty/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: scannedUser.id, pointsToDeduct: 200 })
            });

            if (!response.ok) throw new Error("Erreur lors de la déduction.");
            
            setSuccessMessage("Récompense validée ! 200 points ont été déduits.");
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
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md">
                        <Star size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Scanner VIP H-Designer</h2>
                        <p className="text-slate-500 text-sm mt-1">Identifiez rapidement le client (Caméra, Fichier QR ou Email) et appliquez ses récompenses.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLONNE GAUCHE : RECHERCHE & SCAN */}
                <div className="space-y-6">
                    {/* Option 1 : Caméra & Fichier QR */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Camera style={{ color: 'var(--theme-primary)' }} /> Scanner le QR Code VIP
                        </h3>
                        {showCamera ? (
                            <div className="rounded-2xl overflow-hidden border-4 border-slate-900 relative shadow-2xl">
                                <Scanner 
                                    onScan={(result: any) => {
                                        const text = Array.isArray(result) ? result[0]?.rawValue : result;
                                        if (text) handleScan(text);
                                    }} 
                                    onError={(error: any) => console.log("Scanner Caméra:", error?.message)}
                                />
                                <button 
                                    onClick={() => setShowCamera(false)}
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2"
                                >
                                    <X size={16} /> Fermer la caméra (Échap)
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setShowCamera(true)}
                                    className="w-full py-8 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all text-slate-600 active:scale-98"
                                >
                                    <Camera size={36} className="text-theme-primary" />
                                    <span className="font-bold text-sm">Activer la caméra (Mobile & PC)</span>
                                </button>

                                <div className="relative text-center">
                                    <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">ou importer une image</span>
                                    <div className="absolute inset-y-1/2 inset-x-0 border-t border-slate-200"></div>
                                </div>

                                <label className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 cursor-pointer transition-colors border border-slate-200">
                                    <Upload size={16} />
                                    <span>Téléverser une photo du QR Code</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden" 
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Option 2 : Manuel */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Search style={{ color: 'var(--theme-primary)' }} /> Saisie manuelle par Email
                        </h3>
                        <form 
                            onSubmit={(e) => { e.preventDefault(); if (manualEmail) fetchUserLoyalty(manualEmail, 'email'); }}
                            className="flex gap-2"
                        >
                            <input 
                                type="email" 
                                placeholder="Ex: client@email.com..." 
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                className="flex-1 p-3 rounded-xl border border-slate-200 outline-none transition-all focus:ring-2 focus:border-transparent text-sm"
                            />
                            <button 
                                type="submit"
                                disabled={!manualEmail || loading}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                            >
                                Chercher
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLONNE DROITE : RÉSULTAT DU SCAN */}
                <div>
                    {loading && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3">
                            <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto border-theme-primary"></div>
                            <p className="text-slate-500 font-bold text-sm">Recherche du profil client...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertTriangle size={20} /> <span className="font-bold text-sm">{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 flex items-center gap-3 mb-4">
                            <CheckCircle2 size={20} /> <span className="font-bold text-sm">{successMessage}</span>
                        </div>
                    )}

                    {scannedUser && (
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 border-t-4 border-t-slate-900 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl border border-slate-200">
                                    {scannedUser.prenom ? scannedUser.prenom[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase">{scannedUser.prenom} {scannedUser.nom}</h3>
                                    <p className="text-slate-500 text-xs">{scannedUser.email}</p>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Solde Actuel de Points</p>
                                <p className="text-5xl font-black text-slate-900 flex items-center justify-center gap-2">
                                    {scannedUser.loyalty_points} <Star className="text-amber-400 fill-amber-400" size={40}/>
                                </p>
                            </div>

                            {/* LOGIQUE DE RÉCOMPENSE */}
                            {scannedUser.loyalty_points >= 200 ? (
                                <div 
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                    className="p-6 rounded-2xl text-white text-center shadow-lg"
                                >
                                    <Gift size={40} className="mx-auto mb-3" />
                                    <h4 className="font-black text-xl mb-1">T-Shirt Offert Débloqué !</h4>
                                    <p className="text-sm text-white/80 mb-6">Le client a atteint le palier de 200 points VIP.</p>
                                    <button 
                                        onClick={handleRedeemPoints}
                                        style={{ color: 'var(--theme-primary)' }}
                                        className={`w-full py-3 rounded-xl font-black uppercase tracking-wide transition-colors active:scale-95 select-none text-sm ${confirmRedeem ? 'bg-red-500 text-white border-2 border-red-500 shadow-xl scale-105' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        {confirmRedeem ? "Taper pour Confirmer (!)" : "Valider la gratuité (200 pts)"}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                                    <p className="font-bold text-slate-600 text-sm">Points insuffisants pour la récompense gratuite.</p>
                                    <p className="text-xs text-slate-400 mt-1">Il manque {200 - scannedUser.loyalty_points} points.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};