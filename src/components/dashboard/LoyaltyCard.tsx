import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/apiClient'; 
import { Loader2, Star, Award, QrCode } from 'lucide-react';
import logo2 from '../../assets/Logo2.png';

export const LoyaltyCard = () => {
    const [loyaltyData, setLoyaltyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLoyaltyCard();
    }, []);

    const fetchLoyaltyCard = async () => {
        try {
            const response = await authFetch('/api/loyalty/my-card'); 
            
            if (!response.ok) throw new Error("Impossible de charger la carte VIP.");
            
            const data = await response.json();
            if (data.success) {
                setLoyaltyData(data);
            }
        } catch (err: any) {
            console.error(err);
            setError("Erreur de connexion au système de fidélité.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-3xl border border-slate-100">
                <Loader2 className="animate-spin mb-2" style={{ color: 'var(--theme-primary)' }} size={24} />
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Génération de votre accès...</p>
            </div>
        );
    }

    if (error || !loyaltyData) {
        return (
            <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-sm font-bold text-center border border-red-100">
                {error || "Carte indisponible pour le moment"}
            </div>
        );
    }

    const { user, qrCode } = loyaltyData;

    return (
        <div className="relative max-w-sm mx-auto w-full group">
            {/* 🪄 HALO LUMINEUX DYNAMIQUE (Arrière-plan) */}
            <div 
                className="absolute -inset-4 opacity-20 blur-2xl rounded-full transition-opacity duration-500 group-hover:opacity-40"
                style={{ backgroundColor: 'var(--theme-primary)' }}
            ></div>

            <div className="bg-slate-900 rounded-[32px] p-1 shadow-2xl relative overflow-hidden">
                {/* Effet de brillance (Glassmorphism) */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>
                
                <div className="bg-slate-900 border border-slate-700/50 rounded-[28px] p-6 relative z-10">
                    {/* En-tête de la carte */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                        <div className="h-10">
                            <img src={logo2} alt="H-Designer" className="h-full w-auto object-contain" />
                            <p 
                                className="text-[10px] font-black uppercase tracking-[0.3em] mt-1"
                                style={{ color: 'var(--theme-primary)' }}
                            >
                                Membre VIP Privilège
                            </p>
                        </div>
                        </div>
                        <div 
                            className="p-2.5 rounded-2xl shadow-lg"
                            style={{ 
                                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', 
                                color: 'var(--theme-primary)',
                                border: '1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)'
                            }}
                        >
                            <Award size={22} />
                        </div>
                    </div>

                    {/* Zone QR Code avec Scanneur Animé */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white p-4 rounded-[2rem] shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                            {/* Coins du scanneur */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-2xl m-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-2xl m-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-2xl m-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-2xl m-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
                            
                            <img 
                                src={qrCode} 
                                alt="QR Code VIP" 
                                className="w-36 h-36 object-contain rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Infos Client & Points */}
                    <div className="flex justify-between items-end border-t border-slate-800/50 pt-5 mt-2">
                        <div className="space-y-1">
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Titulaire</p>
                            <p className="text-white font-bold text-lg capitalize">{user.prenom} {user.nom}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Points Fidélité</p>
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-2xl font-black text-white">{user.points}</span>
                                <div className="bg-amber-400/10 p-1 rounded-lg">
                                    <Star size={18} className="text-amber-400 fill-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};