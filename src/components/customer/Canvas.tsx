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
  bgImage?: string;
  hideBaseImage?: boolean;
  color: ProductColor;
  elements: DesignElement[];
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement?: (id: string) => void;
  activeElementId: string | null;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ 
  product, 
  bgImage,
  hideBaseImage,
  color, 
  elements, 
  onSelectElement, 
  onUpdateElement,
  onDeleteElement,
  activeElementId 
}, ref) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // État pour savoir quel texte est en cours d'édition
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🪄 SCALING ADAPTATIF
  // La logique entière du canevas repose sur un espace 500x500 pixels (logical space)
  // afin que le design soit affiché avec précision (en termes de ratio) sur tous les écrans, petit ou grand.
  const [scaleRatio, setScaleRatio] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      if (entries.length > 0) {
          const rect = entries[0].contentRect;
          // on calcule le ratio par rapport au monde logique 500x500
          setScaleRatio(rect.width / 500);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ⚡ GESTION FLUIDE (LOCAL STATE) : Pour éviter la latence sur mobile lors des glissements
  const localTransformRef = useRef<{ id: string, x?: number, y?: number, width?: number, height?: number, fontSize?: number, rotation?: number } | null>(null);
  const [localTransform, setLocalTransform] = useState<{ id: string, x?: number, y?: number, width?: number, height?: number, fontSize?: number, rotation?: number } | null>(null);

  const setLocalAndRef = (val: any) => {
      localTransformRef.current = val;
      setLocalTransform(val);
  };

  // EXPORT IMAGE
  useImperativeHandle(ref, () => ({
    exportAsImage: async () => {
      if (containerRef.current) {
        try {
          onSelectElement(null);
          setEditingId(null);
          await new Promise(r => setTimeout(r, 100)); 

          const canvas = await html2canvas(containerRef.current, {
            useCORS: true,       
            scale: 3,            
            backgroundColor: null, 
            logging: false,
            scrollX: 0,
            scrollY: 0,
            width: containerRef.current.offsetWidth, 
            height: containerRef.current.offsetHeight,
            onclone: (clonedDoc) => {
                // 1. ISOLATION RADICALE : On ne garde que le conteneur du T-shirt dans le body du clone
                const container = clonedDoc.querySelector('.canvas-container');
                if (container) {
                    clonedDoc.body.innerHTML = '';
                    clonedDoc.body.appendChild(container);
                    (container as HTMLElement).style.margin = '0';
                    (container as HTMLElement).style.padding = '0';
                    (container as HTMLElement).style.transform = 'none';
                    (container as HTMLElement).style.background = 'transparent';
                }

                // 2. PURGE TEXTUELLE OKLCH PROFONDE : 
                const oklchRegex = /oklch\([^)]+(\([^)]+\)[^)]*)*\)/g; // Gestion des parenthèses imbriquées

                // A. On purge les balises <style>
                clonedDoc.querySelectorAll('style').forEach(tag => {
                    if (tag.textContent) {
                        tag.textContent = tag.textContent.replace(oklchRegex, '#000');
                    }
                });

                // B. On purge tous les attributs "style" HTML (où Tailwind 4 injecte souvent les variables)
                clonedDoc.querySelectorAll('*').forEach(item => {
                    const el = item as HTMLElement;
                    const styleAttr = el.getAttribute('style');
                    if (styleAttr && styleAttr.includes('oklch')) {
                        el.setAttribute('style', styleAttr.replace(oklchRegex, 'inherit'));
                    }

                    // C. Sécurisation du SVG du T-shirt (Zone de crash critique)
                    if (el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'path') {
                        el.removeAttribute('class'); // On vire les classes Tailwind/DaisyUI qui portent l'oklch
                        el.removeAttribute('filter'); // On vire les filtres CSS/SVG
                        el.style.filter = 'none';
                        el.style.fill = color.hex; // On force la couleur Hex pure
                        if (el.tagName.toLowerCase() === 'path') {
                            el.setAttribute('fill', color.hex); // Backup attributaire
                        }
                    }

                    // On force les pointer-events pour que tout soit capturé
                    if (el.style && el.style.pointerEvents === 'none') {
                        el.style.pointerEvents = 'auto';
                    }
                });

                // 3. CACHE DES OUTILS D'ÉDITION
                clonedDoc.querySelectorAll('[data-html2canvas-ignore="true"]').forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                });
                
                // 4. CACHE DE LA BORDURE DE DESIGN
                clonedDoc.querySelectorAll('.border-dashed, .ring-2').forEach(el => {
                    (el as HTMLElement).style.setProperty('border', 'none', 'important');
                    (el as HTMLElement).style.setProperty('outline', 'none', 'important');
                    (el as HTMLElement).style.setProperty('box-shadow', 'none', 'important');
                });
            }
          });
          
          return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/png', 1.0); 
          });
        } catch (error) {
          console.error("Erreur génération image:", error);
          return null;
        }
      }
      return null;
    }
  }));

  // LOGIQUE DE DÉPLACEMENT RAPIDE 
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
    if (editingId === el.id) return;

    e.stopPropagation(); 
    onSelectElement(el.id);
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialX = el.x;
    const initialY = el.y;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      // moveEvent.preventDefault(); // On ne prevent pas pour allow scroll dans d'autres conditions, mais avec touch-action: none sur l'objet c'est mieux
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const logicalDx = (moveClientX - startX) / scaleRatio;
      const logicalDy = (moveClientY - startY) / scaleRatio;
      
      setLocalAndRef({ ...localTransformRef.current, id: el.id, x: initialX + logicalDx, y: initialY + logicalDy });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      const finalVal = localTransformRef.current;
      if (finalVal && finalVal.id === el.id) {
         onUpdateElement(el.id, { x: finalVal.x ?? el.x, y: finalVal.y ?? el.y });
      }
      setLocalAndRef(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  // LOGIQUE REDIMENSIONNEMENT FLUIDE
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
    e.stopPropagation();
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = el.width;
    const startHeight = el.height || 0;
    const startFontSize = el.fontSize || 30;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const logicalDx = (moveClientX - startX) / scaleRatio;
      const logicalDy = (moveClientY - startY) / scaleRatio;

      let newWidth = Math.max(20, startWidth + logicalDx);
      let newHeight = el.type === 'text' ? undefined : Math.max(20, startHeight + logicalDy);
      let newFontSize = startFontSize;

      if (el.type === 'text') {
         const scaleFactor = newWidth / startWidth;
         newFontSize = Math.max(10, startFontSize * scaleFactor);
      }

      setLocalAndRef({
          ...localTransformRef.current,
          id: el.id,
          width: newWidth,
          height: newHeight,
          fontSize: newFontSize
      });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      const finalVal = localTransformRef.current;
      if (finalVal && finalVal.id === el.id) {
         onUpdateElement(el.id, {
             width: finalVal.width,
             height: finalVal.height,
             fontSize: finalVal.fontSize
         });
      }
      setLocalAndRef(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd); // Use touchend here without passive
  };

  // LOGIQUE ROTATION FLUIDE
  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
    e.stopPropagation();
    
    const box = (e.target as HTMLElement).closest('.group')?.getBoundingClientRect();
    if (!box) return;

    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const radians = Math.atan2(moveClientY - centerY, moveClientX - centerX);
      const degrees = radians * (180 / Math.PI);

      setLocalAndRef({
          ...localTransformRef.current,
          id: el.id,
          rotation: degrees + 90
      });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      const finalVal = localTransformRef.current;
      if (finalVal && finalVal.id === el.id) {
         onUpdateElement(el.id, { rotation: finalVal.rotation ?? el.rotation });
      }
      setLocalAndRef(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  const getElState = (el: DesignElement) => {
    if (localTransform && localTransform.id === el.id) {
      return { ...el, ...localTransform };
    }
    return el;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-slate-100 dark:bg-slate-900/40 canvas-container relative h-full transition-colors">
      
      <div 
        ref={containerRef}
        className="relative shadow-2xl rounded-2xl bg-white dark:bg-slate-800 w-full max-w-[350px] md:max-w-[500px] aspect-square transition-colors z-0"
        onClick={() => {
            onSelectElement(null);
            setEditingId(null); 
        }} 
      >
        {/* Fond Produit avec coloration dynamique parfaite */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          {hideBaseImage ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-[85%] h-[85%] mb-[10%] drop-shadow-md transition-colors duration-500" preserveAspectRatio="xMidYMid meet">
              <path fill={color.hex} d="M469.3,165.3l-26.7-53.3c-2.1-4.3-5.3-7.5-9.6-9.6l-106.7-42.7c-2.6-1.1-5.5-1.6-8.5-1.6c-4.4,0-8.7,1.2-12.5,3.6L256,92 l-49.3-30.3c-3.8-2.3-8.1-3.6-12.5-3.6c-3,0-5.9,0.5-8.5,1.6L79.1,102.4c-4.3,2.1-7.5,5.3-9.6,9.6L42.8,165.3 c-2.5,5.1-2.9,11-1.1,16.4c1.8,5.4,5.6,9.8,10.6,12.3l42.7,21.3v216.5c0,11.8,9.6,21.3,21.3,21.3h277.3c11.8,0,21.3-9.6,21.3-21.3 V215.3l42.7-21.3c5-2.5,8.8-6.9,10.6-12.3C472.2,176.3,471.8,170.4,469.3,165.3z" />
            </svg>
          ) : (
            <>
              <img 
                crossOrigin="anonymous"
                src={bgImage || (product.image_url ? (product.image_url.startsWith('http') ? product.image_url : BASE_IMG_URL + product.image_url) + `?t=${Date.now()}` : '')} 
                alt={product.name} 
                className="w-full h-full object-contain md:object-cover select-none transition-opacity duration-300"
                style={{ opacity: 0.95 }}
              />
              {/* Calque de couleur avec masque CSS pour ne colorer que le T-shirt, pas le fond transparent */}
              <div 
                className="absolute inset-0 mix-blend-multiply opacity-80 transition-colors duration-500" 
                style={{ 
                  backgroundColor: color.hex,
                  WebkitMaskImage: `url(${bgImage || (product.image_url ? (product.image_url.startsWith('http') ? product.image_url : BASE_IMG_URL + product.image_url) : '')})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                  maskImage: `url(${bgImage || (product.image_url ? (product.image_url.startsWith('http') ? product.image_url : BASE_IMG_URL + product.image_url) : '')})`,
                  maskSize: 'contain',
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat'
                }}
              />
            </>
          )}
        </div>

        {/* Zone impression */}
        <div 
            className="absolute inset-[15%] border border-dashed border-slate-300/50 dark:border-slate-600/50 rounded-lg pointer-events-none flex items-start justify-center pt-2 z-0"
            data-html2canvas-ignore="true"
        >
           <span className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest bg-white/50 dark:bg-slate-900/50 px-2 rounded-full backdrop-blur-sm">
             Zone d'impression
           </span>
        </div>

        {/* Éléments */}
        <div className="absolute inset-0 z-10">
          {elements.map((globalEl) => {
            const el = getElState(globalEl);

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleDragStart(e, el)}
                onTouchStart={(e) => handleDragStart(e, el)}
                onClick={(e) => e.stopPropagation()} 
                
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (el.type === 'text') setEditingId(el.id);
                }}

                className={`absolute cursor-move select-none touch-none group ${
                  activeElementId === el.id && editingId !== el.id // On cache la bordure si on édite
                  ? 'z-50 ring-2 ring-offset-2 ring-offset-transparent' 
                  : 'z-10 hover:ring-1 hover:ring-slate-300' 
                }`}
                style={{
                  // 🪄 ADAPTATIF : Multiplier par scaleRatio garantit le rendu proportionnel sur tous les écrans
                  left: `${el.x * scaleRatio}px`,
                  top: `${el.y * scaleRatio}px`,
                  width: `${el.width * scaleRatio}px`,
                  height: el.type === 'text' ? 'auto' : `${(el.height || 0) * scaleRatio}px`,
                  transform: `rotate(${el.rotation}deg)`,
                  opacity: el.opacity ?? 1,
                  ...(activeElementId === el.id && editingId !== el.id ? { '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties : {})
                }}
              >
                {el.type === 'text' ? (
                  editingId === el.id ? (
                      <textarea
                          autoFocus
                          value={el.content}
                          onChange={(e) => onUpdateElement(el.id, { content: e.target.value })}
                          onBlur={() => setEditingId(null)} 
                          onMouseDown={(e) => e.stopPropagation()} 
                          className="w-full h-full bg-transparent resize-none outline-none overflow-hidden"
                          style={{
                              fontFamily: el.fontFamily, 
                              fontSize: `${(el.fontSize || 30) * scaleRatio}px`, 
                              color: el.color,
                              textAlign: 'center',
                              minHeight: '1.2em'
                          }}
                      />
                  ) : (
                      <div 
                        className="whitespace-pre-wrap break-words leading-tight p-2 w-full h-full"
                        style={{ 
                          fontFamily: el.fontFamily, 
                          fontSize: `${(el.fontSize || 30) * scaleRatio}px`, 
                          color: el.color,
                          textAlign: 'center',
                          pointerEvents: 'none' // Pour ne pas interférer avec le glissement de la boîte
                        }}
                      >
                        {el.content}
                      </div>
                  )
                ) : (
                  <div 
                    className={`absolute w-full h-full flex items-center justify-center overflow-visible transition-opacity ${editingId === el.id ? 'opacity-30' : 'opacity-100'}`}
                    style={{ opacity: el.opacity !== undefined ? el.opacity : 1 }}
                  >
                    <img 
                      {...(el.content.startsWith('http') ? { crossOrigin: "anonymous" } : {})}
                      src={el.content} 
                      alt="Element" 
                      className="w-full h-full object-contain pointer-events-none" 
                      style={{ borderRadius: el.borderRadius ? `${el.borderRadius}%` : '0' }} 
                    />
                  </div>
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
                      className="absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center shadow-md md:w-7 md:h-7 cursor-nwse-resize hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Maximize2 size={12} />
                    </div>

                    <div 
                      onMouseDown={(e) => handleRotateStart(e, el)}
                      onTouchStart={(e) => handleRotateStart(e, el)}
                      className="absolute -bottom-3 -left-3 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center shadow-md md:w-7 md:h-7 cursor-ew-resize hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <RotateCcw size={12} />
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Canvas;