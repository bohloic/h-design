import React, { useState, useRef, useEffect } from 'react';
import { Upload, Type, Download, Save, RefreshCw, Check } from 'lucide-react';

const TShirtDesigner = ({ baseImage, onSaveDesign }) => {
  // --- STATE ---
  const [customText, setCustomText] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Position et Taille du logo (valeurs en %)
  const [logoPos, setLogoPos] = useState({ x: 35, y: 30, scale: 1 }); // x, y en %, scale en ratio

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- GESTIONNAIRES ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setUploadedImage(url);
    }
  };

  // --- GÉNÉRATION DE L'IMAGE FINALE (CANVAS) ---
  const generateFinalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tShirtImg = new Image();
    tShirtImg.crossOrigin = "anonymous"; // Important si images externes
    tShirtImg.src = baseImage;

    tShirtImg.onload = () => {
      // 1. Nettoyer et dessiner le T-shirt de base
      canvas.width = tShirtImg.width;
      canvas.height = tShirtImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tShirtImg, 0, 0);

      // 2. Dessiner le Logo Uploadé
      if (uploadedImage) {
        const logoImg = new Image();
        logoImg.src = uploadedImage;
        logoImg.onload = () => {
            // Calcul des positions réelles basées sur les %
            const x = (canvas.width * logoPos.x) / 100;
            const y = (canvas.height * logoPos.y) / 100;
            const width = (canvas.width * 0.3) * logoPos.scale; // Base 30% de largeur
            const height = (logoImg.height / logoImg.width) * width; // Garder le ratio

            // Mode "Multiply" pour l'incrustation réaliste
            ctx.globalCompositeOperation = 'multiply'; 
            ctx.drawImage(logoImg, x, y, width, height);
            
            // On remet le mode normal pour le texte
            ctx.globalCompositeOperation = 'source-over'; 
            drawText(ctx, canvas);
            exportResult();
        };
      } else {
          drawText(ctx, canvas);
          exportResult();
      }
    };
  };

  const drawText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (customText) {
          const x = canvas.width / 2; // Centré
          const y = canvas.height * 0.45; // Un peu au dessus du milieu
          
          ctx.font = "bold 80px Arial"; // Adapte la taille selon ton image de base
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          
          // Petit effet de rotation légère pour le style
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.05); // Rotation -2 degrés
          ctx.fillText(customText, 0, 0);
          ctx.restore();
      }
  };

  const exportResult = () => {
      const canvas = canvasRef.current;
      if(canvas) {
          // Convertit le canvas en fichier Blob/File prêt à être envoyé au backend
          canvas.toBlob((blob) => {
              if (blob && onSaveDesign) {
                  const file = new File([blob], "custom_tshirt.png", { type: "image/png" });
                  onSaveDesign(file); // Renvoie le fichier au composant parent
              }
          });
      }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
      
      {/* --- ZONE VISUELLE (PREVIEW CSS) --- */}
      <div className="relative w-full max-w-md mx-auto aspect-square bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        
        {/* Image T-shirt */}
        <img src={baseImage} alt="T-shirt" className="w-full h-full object-cover z-0" />

        {/* Zone d'impression (Overlay CSS) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            
            {/* Logo Client */}
            {uploadedImage && (
                <div 
                    className="absolute transition-all duration-200"
                    style={{ 
                        left: `${logoPos.x}%`, 
                        top: `${logoPos.y}%`, 
                        width: `${30 * logoPos.scale}%`,
                        // ✨ LE SECRET DU RÉALISME CSS ✨
                        mixBlendMode: 'multiply' 
                    }}
                >
                    <img src={uploadedImage} alt="Logo" className="w-full h-full object-contain" />
                </div>
            )}

            {/* Texte Client */}
            {customText && (
                <p 
                    className="absolute font-black text-3xl text-center z-20 break-words w-2/3"
                    style={{ 
                        top: '45%', 
                        color: textColor,
                        transform: 'rotate(-2deg)',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.5)'
                    }}
                >
                    {customText}
                </p>
            )}
        </div>

        {/* Grille de repère (optionnel pour aider) */}
        <div className="absolute inset-0 border-2 border-dashed border-slate-300 opacity-20 pointer-events-none m-12 rounded-lg"></div>
      </div>

      {/* --- OUTILS DE PERSONNALISATION --- */}
      <div className="flex-1 space-y-6">
        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Save className="text-red-600" /> Studio de Création
        </h3>

        {/* 1. Upload Image */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Upload size={16} /> Ajouter une image/logo
            </label>
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            {uploadedImage && (
                <div className="flex gap-2 text-xs mt-2">
                    <button onClick={() => setLogoPos(p => ({...p, scale: p.scale + 0.1}))} className="bg-white border px-2 py-1 rounded">Agrandir</button>
                    <button onClick={() => setLogoPos(p => ({...p, scale: Math.max(0.2, p.scale - 0.1)}))} className="bg-white border px-2 py-1 rounded">Rétrécir</button>
                    <button onClick={() => setLogoPos(p => ({...p, y: p.y + 5}))} className="bg-white border px-2 py-1 rounded">Descendre</button>
                    <button onClick={() => setLogoPos(p => ({...p, y: p.y - 5}))} className="bg-white border px-2 py-1 rounded">Monter</button>
                </div>
            )}
        </div>

        {/* 2. Texte */}
        <div className="space-y-2">
             <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Type size={16} /> Ajouter du texte
            </label>
            <input 
                type="text" 
                placeholder="Votre texte ici..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
            />
             <div className="flex items-center gap-2 mt-2">
                <label className="text-xs font-bold text-slate-500">Couleur :</label>
                <input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-none"
                />
            </div>
        </div>

        {/* 3. Bouton Générer */}
        <div className="pt-4 border-t border-slate-100">
            <button 
                onClick={generateFinalImage}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
            >
                <Check size={18} /> Valider ce design
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">
                Génère l'image finale pour l'impression.
            </p>
        </div>

        {/* Canvas Caché (Sert uniquement au moteur de rendu) */}
        <canvas ref={canvasRef} className="hidden" />
        
      </div>
    </div>
  );
};

export default TShirtDesigner;