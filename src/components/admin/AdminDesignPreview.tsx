import React from 'react';

interface AdminDesignPreviewProps {
    productImage: string;
    customizationJson: any;
}

export const AdminDesignPreview: React.FC<AdminDesignPreviewProps> = ({ productImage, customizationJson }) => {
    // 1. Initialisation sécurisée du tableau pour éviter l'erreur TypeScript
    let elements: any[] = [];

    try {
        // On utilise 'any' pour éviter que TypeScript ne bloque sur .design ou .elements
        const rawData: any = typeof customizationJson === 'string' ? JSON.parse(customizationJson) : customizationJson;
        
        // Extraction des données selon le format (nouveau ou ancien)
        if (Array.isArray(rawData)) {
            elements = rawData;
        } else if (rawData?.design) {
            elements = rawData.design;
        } else if (rawData?.elements) {
            elements = rawData.elements;
        }

        // Sécurité : si ce n'est toujours pas un tableau, on vide
        if (!Array.isArray(elements)) elements = [];

    } catch (e) {
        return <div className="text-red-500 text-xs">Erreur de lecture du design</div>;
    }

    // --- FONCTION INTELLIGENTE DE NETTOYAGE D'URL (Comme dans OrderDetailView) ---
    const getCleanUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) {
            return path;
        }
        // On enlève les /images/ en trop et les doubles //
        const cleanPath = path.replace('//', '/').replace('/images/', '');
        // On retourne le chemin propre qui passera par ton proxy Vite
        return `/images/${cleanPath}`;
    };

    const downloadSourceImage = (url: string, index: number) => {
        const link = document.createElement('a');
        // On utilise l'URL nettoyée pour le téléchargement
        link.href = getCleanUrl(url);
        link.download = `element_source_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                {/* 🪄 TITRE DYNAMIQUE */}
                <h4 
                    className="text-xs font-bold uppercase flex items-center gap-2"
                    style={{ color: 'var(--theme-primary)' }}
                >
                    Fichiers Sources (HD)
                </h4>
                
                {elements.map((el: any, idx: number) => (
                    el.type === 'image' ? (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                {/* Aperçu de l'image avec l'URL corrigée */}
                                <div className="w-10 h-10 bg-slate-50 rounded border flex-shrink-0 overflow-hidden">
                                    <img 
                                        src={getCleanUrl(el.content)}
                                        className="w-full h-full object-contain"
                                        alt={`Elément ${idx}`}
                                    />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">Image #{idx + 1}</span>
                                    <span className="text-[10px] text-slate-400">Fichier original pour impression</span>
                                </div>
                            </div>
                            {/* Le bouton télécharger reste bleu (action neutre/sémantique en admin) */}
                            <button 
                                onClick={() => downloadSourceImage(el.content, idx)}
                                className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-bold hover:bg-blue-100 border border-blue-200 transition-colors"
                            >
                                Télécharger HD
                            </button>
                        </div>
                    ) : (
                        // Affichage pour le texte (pas d'image à télécharger)
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                             <div className="flex items-center gap-3">
                                {/* 🪄 ICONE TEXTE DYNAMIQUE */}
                                <span 
                                    className="w-10 h-10 flex items-center justify-center rounded font-serif font-bold text-lg shadow-sm"
                                    style={{ 
                                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', 
                                        color: 'var(--theme-primary)' 
                                    }}
                                >
                                    T
                                </span>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">Texte : "{el.content}"</span>
                                    <span className="text-[10px] text-slate-400">Police: {el.fontFamily} | Couleur: {el.color}</span>
                                </div>
                            </div>
                        </div>
                    )
                ))}

                {elements.length === 0 && (
                     <p className="text-xs text-slate-400 italic py-2">Aucun élément individuel détecté.</p>
                )}
            </div>
        </div>
    );
};