import { downloadHDImage } from '@/utils/imageDownloader';
import { BASE_IMG_URL } from '../images/VoirImage';

interface AdminDesignPreviewProps {
    productImage?: string;
    customizationJson: any;
}

export const AdminDesignPreview: React.FC<AdminDesignPreviewProps> = ({ customizationJson }) => {
    // 1. Initialisation sécurisée du tableau pour éviter l'erreur TypeScript
    let elements: any[] = [];

    try {
        const rawData: any = typeof customizationJson === 'string' ? JSON.parse(customizationJson) : customizationJson;
        
        if (Array.isArray(rawData)) {
            elements = rawData;
        } else if (rawData?.design) {
            elements = rawData.design;
        } else if (rawData?.elements) {
            elements = rawData.elements;
        }

        if (!Array.isArray(elements)) elements = [];

    } catch (e) {
        return <div className="text-red-500 text-xs">Erreur de lecture du design</div>;
    }

    // --- FONCTION INTELLIGENTE DE NETTOYAGE D'URL ---
    const getCleanUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
            return path;
        }
        if (path.startsWith('h-designer/') || path.startsWith('v1')) {
            return `https://res.cloudinary.com/dwyx9e7zw/image/upload/q_100,f_png/${path}`;
        }
        const cleanPath = path.replace(/^\/+/, '').replace(/^images\//, '');
        return `${BASE_IMG_URL}${cleanPath}`;
    };

    const handleDownload = async (url: string, index: number) => {
        const fileName = `source_element_hd_${index + 1}.png`;
        await downloadHDImage(url, fileName);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                {/* 🪄 TITRE DYNAMIQUE */}
                <h4 
                    className="text-xs font-bold uppercase flex items-center gap-2 text-theme-primary"
                >
                    Fichiers Sources Original Haute Définition (HD)
                </h4>
                
                {elements.map((el: any, idx: number) => (
                    el.type === 'image' ? (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                {/* Aperçu de l'image avec l'URL nettoyée */}
                                <div className="w-10 h-10 bg-slate-50 rounded border flex-shrink-0 overflow-hidden">
                                    <img 
                                        src={getCleanUrl(el.content)}
                                        className="w-full h-full object-contain"
                                        alt={`Elément ${idx}`}
                                    />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">Image Source #{idx + 1}</span>
                                    <span className="text-[10px] text-slate-400">Qualité originale d'impression (PNG/HD)</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDownload(el.content, idx)}
                                title="Télécharger le fichier original en haute définition"
                                className="text-[10px] bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-white px-3 py-1.5 rounded font-bold border border-theme-primary/30 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                            >
                                📥 Télécharger HD
                            </button>
                        </div>
                    ) : (
                        // Affichage pour le texte (pas d'image à télécharger)
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                             <div className="flex items-center gap-3">
                                {/* 🪄 ICONE TEXTE DYNAMIQUE */}
                                <span 
                                    className="w-10 h-10 flex items-center justify-center rounded font-serif font-bold text-lg shadow-sm bg-theme-primary/10 text-theme-primary"
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