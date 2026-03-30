import React from 'react';
import { Gift, TrendingUp, ShoppingBag, Sparkles } from 'lucide-react';
import { LoyaltyCard } from '@/src/components/dashboard/LoyaltyCard';

export const LoyaltyTab = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* EN-TÊTE */}
            <div className="bg-white dark:bg-[#1A1A1C] p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 transition-colors">
                {/* 🪄 COULEURS DYNAMIQUES */}
                <div 
                    className="p-4 rounded-2xl"
                    style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', 
                        color: 'var(--theme-primary)' 
                    }}
                >
                    <Sparkles size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-pure transition-colors tracking-tight">Club Privilège H-Designer</h2>
                    <p className="text-slate-500 text-sm mt-1">Votre fidélité récompensée à chaque création.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* COLONNE GAUCHE : LA CARTE */}
                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-[#151515] p-8 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                    <LoyaltyCard />
                    <p className="text-xs text-slate-400 mt-6 text-center max-w-xs">
                        Présentez ce QR Code lors de vos retraits en atelier pour utiliser vos points.
                    </p>
                </div>

                {/* COLONNE DROITE : COMMENT ÇA MARCHE */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-pure transition-colors mb-4">Comment ça marche ?</h3>
                    
                    <div className="bg-white dark:bg-[#1A1A1C] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-start gap-4 transition-colors">
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl text-slate-600 dark:text-slate-300"><ShoppingBag size={20} /></div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-pure transition-colors">1. Collectionnez</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">À chaque vêtement commandé et livré, vous gagnez des points (1 Article = 20 Points).</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1C] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-start gap-4 transition-colors">
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl text-slate-600 dark:text-slate-300"><TrendingUp size={20} /></div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-pure transition-colors">2. Suivez votre jauge</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">Votre solde de points se met à jour automatiquement sur votre carte VIP H-Designer ci-contre.</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1C] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-start gap-4 transition-colors">
                        {/* 🪄 COULEURS DYNAMIQUES */}
                        <div 
                            className="p-3 rounded-xl"
                            style={{ 
                                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', 
                                color: 'var(--theme-primary)' 
                            }}
                        >
                            <Gift size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-pure transition-colors">3. La Récompense</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Dès que vous atteignez 200 points (10 articles achetés), votre 11ème création personnalisée vous est <strong style={{ color: 'var(--theme-primary)' }}>totalement offerte !</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};