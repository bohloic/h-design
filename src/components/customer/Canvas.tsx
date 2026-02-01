import { BASE_IMG_URL } from '@/src/components/images/VoirImage';
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { DesignElement, Product, ProductColor } from '../../../types';
import { RotateCcw, Maximize2, X } from 'lucide-react'; 
import html2canvas from 'html2canvas';

export interface CanvasHandle {
  exportAsImage: () => Promise<Blob | null>;
}

interface CanvasProps {
  product: Product;
  color: ProductColor;
  elements: DesignElement[];
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement?: (id: string) => void;
  activeElementId: string | null;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ 
  product, 
  color, 
  elements, 
  onSelectElement, 
  onUpdateElement,
  onDeleteElement,
  activeElementId 
}, ref) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // NOUVEAU : État pour savoir quel texte est en cours d'édition
  const [editingId, setEditingId] = useState<string | null>(null);

  // EXPORT IMAGE
  useImperativeHandle(ref, () => ({
    exportAsImage: async () => {
      if (containerRef.current) {
        try {
          onSelectElement(null);
          setEditingId(null); // On ferme l'édition si ouverte
          await new Promise(r => setTimeout(r, 50));

          const canvas = await html2canvas(containerRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: null,
            logging: false
          });
          
          return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/png');
          });
        } catch (error) {
          console.error("Erreur génération image:", error);
          return null;
        }
      }
      return null;
    }
  }));

  // LOGIQUE DE DÉPLACEMENT
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
    // Si on est en train d'éditer CE texte, on ne le déplace pas
    if (editingId === el.id) return;

    e.stopPropagation(); 
    onSelectElement(el.id);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;
    const initialX = el.x;
    const initialY = el.y;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault(); 
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = moveClientX - startX;
      const dy = moveClientY - startY;
      
      onUpdateElement(el.id, {
        x: initialX + dx,
        y: initialY + dy
      });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  // LOGIQUE REDIMENSIONNEMENT
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;
    const startWidth = el.width;
    const startHeight = el.height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault();
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = moveClientX - startX;
      const dy = moveClientY - startY;

      onUpdateElement(el.id, {
        width: Math.max(20, startWidth + dx),
        height: el.type === 'text' ? undefined : Math.max(20, startHeight + dy)
      });

      if (el.type === 'text') {
         const scaleFactor = (startWidth + dx) / startWidth;
         onUpdateElement(el.id, {
             width: Math.max(20, startWidth + dx),
             fontSize: Math.max(10, el.fontSize * scaleFactor)
         });
      }
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  // LOGIQUE ROTATION
  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
    e.stopPropagation();
    e.preventDefault();

    const box = (e.target as HTMLElement).closest('.group')?.getBoundingClientRect();
    if (!box) return;

    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault();
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const radians = Math.atan2(moveClientY - centerY, moveClientX - centerX);
      const degrees = radians * (180 / Math.PI);

      onUpdateElement(el.id, {
        rotation: degrees + 90
      });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-slate-100 canvas-container relative h-full">
      
      <div 
        ref={containerRef}
        className="relative shadow-2xl rounded-2xl bg-white w-full max-w-[350px] md:max-w-[500px] aspect-square transition-all duration-300 z-0"
        onClick={() => {
            onSelectElement(null);
            setEditingId(null); // Quitter l'édition si on clique ailleurs
        }} 
      >
        {/* Fond Produit */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 mix-blend-multiply opacity-40 transition-colors duration-500" 
            style={{ backgroundColor: color.hex }}
          />
          <img 
            crossOrigin="anonymous"
            src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : BASE_IMG_URL + product.image_url) + `?t=${Date.now()}` : ''} 
            alt={product.name} 
            className="w-full h-full object-contain md:object-cover select-none"
            style={{ opacity: 0.95 }}
          />
        </div>

        {/* Zone impression */}
        <div 
            className="absolute inset-[15%] border border-dashed border-slate-300/50 rounded-lg pointer-events-none flex items-start justify-center pt-2 z-0"
            data-html2canvas-ignore="true"
        >
           <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white/50 px-2 rounded-full backdrop-blur-sm">
             Zone d'impression
           </span>
        </div>

        {/* Éléments */}
        <div className="absolute inset-0 z-10">
          {elements.map((el) => (
            <div
              key={el.id}
              onMouseDown={(e) => handleDragStart(e, el)}
              onTouchStart={(e) => handleDragStart(e, el)}
              onClick={(e) => e.stopPropagation()} 
              
              // NOUVEAU : Double clic pour éditer le texte
              onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (el.type === 'text') setEditingId(el.id);
              }}

              className={`absolute cursor-move select-none touch-none group ${
                activeElementId === el.id && editingId !== el.id // On cache la bordure si on édite
                ? 'z-50 ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' 
                : 'z-10 hover:ring-1 hover:ring-blue-300' 
              }`}
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: el.type === 'text' ? 'auto' : `${el.height}px`,
                transform: `rotate(${el.rotation}deg)`,
              }}
            >
              {el.type === 'text' ? (
                // NOUVEAU : Mode Édition vs Mode Affichage
                editingId === el.id ? (
                    <textarea
                        autoFocus
                        value={el.content}
                        onChange={(e) => onUpdateElement(el.id, { content: e.target.value })}
                        onBlur={() => setEditingId(null)} // Sortir du mode édition quand on perd le focus
                        onMouseDown={(e) => e.stopPropagation()} // Permettre la sélection du texte
                        className="w-full h-full bg-transparent resize-none outline-none overflow-hidden"
                        style={{
                            fontFamily: el.fontFamily, 
                            fontSize: `${el.fontSize}px`, 
                            color: el.color,
                            textAlign: 'center',
                            minHeight: '1.2em'
                        }}
                    />
                ) : (
                    <div 
                      className="whitespace-pre-wrap break-words leading-tight p-2"
                      style={{ 
                        fontFamily: el.fontFamily, 
                        fontSize: `${el.fontSize}px`, 
                        color: el.color,
                        textAlign: 'center'
                      }}
                    >
                      {el.content}
                    </div>
                )
              ) : (
                <img src={el.content} alt="Element" className="w-full h-full object-contain pointer-events-none" />
              )}

              {/* OUTILS (Cachés pendant l'édition de texte pour ne pas gêner) */}
              {activeElementId === el.id && editingId !== el.id && (
                <div data-html2canvas-ignore="true"> 
                  
                  <div 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        if(onDeleteElement) onDeleteElement(el.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg md:w-7 md:h-7 cursor-pointer z-50 transition-transform hover:scale-110"
                  >
                    <X size={14} />
                  </div>

                  <div 
                    onMouseDown={(e) => handleResizeStart(e, el)}
                    onTouchStart={(e) => handleResizeStart(e, el)}
                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-md md:w-7 md:h-7 cursor-nwse-resize hover:bg-blue-50"
                  >
                    <Maximize2 size={12} />
                  </div>

                  <div 
                    onMouseDown={(e) => handleRotateStart(e, el)}
                    onTouchStart={(e) => handleRotateStart(e, el)}
                    className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-md md:w-7 md:h-7 cursor-ew-resize hover:bg-blue-50"
                  >
                    <RotateCcw size={12} />
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Canvas;