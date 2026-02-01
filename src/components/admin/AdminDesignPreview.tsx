import React from 'react';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage';

interface AdminDesignPreviewProps {
    productImage: string;
    customizationJson: any;
}

export const AdminDesignPreview: React.FC<AdminDesignPreviewProps> = ({ productImage, customizationJson }) => {
    let elements = [];
    try {
        elements = typeof customizationJson === 'string' ? JSON.parse(customizationJson) : customizationJson;
        if (!Array.isArray(elements)) elements = [];
    } catch (e) {
        return <div className="text-red-500 text-xs">Erreur données design</div>;
    }

    const downloadSourceImage = (url: string, index: number) => {
        const link = document.createElement('a');
        const validUrl = (url.startsWith('http') || url.startsWith('data:')) ? url : `http://localhost:205${url}`;
        link.href = validUrl;
        link.download = `design_element_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6">
            
            {/* ZONE DE VISUALISATION (MAQUETTE)
                -----------------------------------
                Astuce : On crée un conteneur de 500x500px (taille de référence du Canvas)
                mais on le réduit visuellement avec 'scale' pour qu'il rentre dans l'admin.
                Cela garantit que les positions X/Y sont EXACTES.
            */}
            <div className="relative w-full h-[300px] flex justify-center items-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                
                {/* Le Canvas Virtuel (500x500) mis à l'échelle */}
                <div 
                    style={{ 
                        width: '500px', 
                        height: '500px', 
                        transform: 'scale(0.55)', // On réduit à 55% pour l'affichage
                        transformOrigin: 'center center'
                    }}
                    className="relative bg-white shadow-2xl shrink-0"
                >
                    {/* 1. Image du T-Shirt (Fond) */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <img 
                            src={productImage ? (productImage.startsWith('http') ? productImage : BASE_IMG_URL + productImage) : ''} 
                            className="w-full h-full object-contain"
                            alt="Produit base"
                        />
                    </div>

                    {/* 2. Les Éléments (Positions exactes basées sur 500px) */}
                    {elements.map((el: any, idx: number) => (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                left: `${el.x}px`,
                                top: `${el.y}px`,
                                width: `${el.width}px`,
                                height: el.type === 'text' ? 'auto' : `${el.height}px`,
                                transform: `rotate(${el.rotation}deg)`,
                                zIndex: 10,
                            }}
                        >
                            {el.type === 'text' ? (
                                <div style={{ 
                                    fontFamily: el.fontFamily, 
                                    fontSize: `${el.fontSize}px`, 
                                    color: el.color,
                                    textAlign: 'center',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.2'
                                }}>
                                    {el.content}
                                </div>
                            ) : (
                                <img 
                                    src={(el.content.startsWith('http') || el.content.startsWith('data:')) ? el.content : `http://localhost:205${el.content}`}
                                    className="w-full h-full object-contain"
                                    alt="Design"
                                />
                            )}
                        </div>
                    ))}
                </div>
                
                <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-white/80 px-2 rounded">
                    Aperçu recomposé
                </span>
            </div>

            {/* LISTE DES FICHIERS (Boutons Télécharger) */}
            <div className="space-y-3">
                <h4 className="font-bold text-slate-700 text-xs uppercase border-b pb-1">Fichiers sources</h4>
                {elements.map((el: any, idx: number) => (
                    el.type === 'image' && (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2">
                                <img 
                                    src={(el.content.startsWith('http') || el.content.startsWith('data:')) ? el.content : `http://localhost:205${el.content}`}
                                    className="w-8 h-8 object-contain bg-slate-50 rounded border"
                                />
                                <span className="text-xs font-medium text-slate-600">Image #{idx + 1}</span>
                            </div>
                            <button 
                                onClick={() => downloadSourceImage(el.content, idx)}
                                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 border border-blue-200 transition-colors"
                            >
                                Télécharger HD
                            </button>
                        </div>
                    )
                ))}
                {/* S'il n'y a que du texte */}
                {!elements.some((e: any) => e.type === 'image') && (
                    <p className="text-xs text-slate-400 italic">Ce design ne contient que du texte.</p>
                )}
            </div>
        </div>
    );
};