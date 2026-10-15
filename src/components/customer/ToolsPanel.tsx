import React, { useState, useEffect } from 'react';
import { Type, Image as ImageIcon, Sparkles, Plus, Trash2, Palette, Check, RefreshCw, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { ProductColor, DesignElement } from '../../../types';
import { getDesignSuggestions } from '../../../services/geminiService';
import { FONTS } from '../../constants';

export type ToolTabType = 'product' | 'text' | 'image' | 'ai' | 'layers';

export interface ToolsPanelProps {
  onAddText: (text: string, font: string) => void;
  onAddImage: (url: string) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
  onAIGenerate: (prompt: string) => Promise<string | null>; 
  activeElement: DesignElement | null;
  colors: ProductColor[];
  selectedColor: ProductColor;
  onSelectColor: (c: ProductColor) => void;
  hideBaseDesign?: boolean;
  setHideBaseDesign?: (val: boolean) => void;
  elements?: DesignElement[];
  onSelectElement?: (id: string) => void;
  onReorderElements?: (elements: DesignElement[]) => void;
  currentTab?: ToolTabType;
  onTabChange?: (tab: ToolTabType) => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  onAddText, 
  onAddImage, 
  onUpdateElement, 
  onDeleteElement,
  onAIGenerate,
  activeElement,
  colors = [], 
  selectedColor,
  onSelectColor,
  hideBaseDesign,
  setHideBaseDesign,
  elements = [],
  onSelectElement,
  onReorderElements,
  currentTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<ToolTabType>(currentTab || 'text');
  const [inputText, setInputText] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  
  // AI State
  const [aiSubTab, setAiSubTab] = useState<'text' | 'image'>('text');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

  const handleTabClick = (tabId: ToolTabType) => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  const handleAiTextSearch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const suggestions = await getDesignSuggestions(aiPrompt);
      setAiSuggestions(suggestions);
    } catch (error) { console.error(error); } 
    finally { setIsAiLoading(false); }
  };

  const handleAiImageGen = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setGeneratedImageUrl(null); 
    try {
      const url = await onAIGenerate(aiPrompt);
      if (url) {
          setGeneratedImageUrl(url); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 🛡️ Validation de sécurité : Type MIME autorisé
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert("Format non supporté. Veuillez sélectionner une image au format PNG, JPEG, WEBP ou SVG.");
        e.target.value = '';
        return;
      }

      // 🛡️ Validation de sécurité : Limite de taille max (5 Mo)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        alert("L'image est trop volumineuse. La taille maximale autorisée est de 5 Mo.");
        e.target.value = '';
        return;
      }
      
      try {
        const { uploadDesignToServer } = await import('../../../src/utils/apiClient');
        const { BASE_IMG_URL } = await import('../images/VoirImage');
        const url = await uploadDesignToServer(file);
        if (url) {
          const fullUrl = url.startsWith('http') ? url : BASE_IMG_URL + url;
          onAddImage(fullUrl);
        }
      } catch (error) {
        console.error("Erreur upload direct:", error);
        alert("Impossible d'ajouter l'image : erreur de connexion au serveur.");
      } finally {
        e.target.value = '';
      }
    }
  };

  const tabs: { id: ToolTabType; icon: React.ReactNode; label: string }[] = [
    { id: 'product', icon: <Palette size={18} />, label: 'Couleur' },
    { id: 'text', icon: <Type size={18} />, label: 'Texte' },
    { id: 'image', icon: <ImageIcon size={18} />, label: 'Images' },
    { id: 'ai', icon: <Sparkles size={18} />, label: 'IA' },
    { id: 'layers', icon: <Layers size={18} />, label: `Calques${elements.length > 0 ? ` (${elements.length})` : ''}` },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col relative transition-colors">
      
      {/* TABS HEADER */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{ touchAction: 'manipulation' }}
            className={`flex-1 min-h-[48px] min-w-[64px] flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all active:bg-slate-50 cursor-pointer ${
              activeTab === tab.id ? 'active text-theme-primary border-b-2 border-theme-primary font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] uppercase tracking-tight whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENU DU PANNEAU */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar pb-24 md:pb-6 bg-slate-50/40">
        
        {/* 1. COULEUR & TEXTILE */}
        {activeTab === 'product' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Palette size={16} className="text-theme-primary"/> Couleur du produit
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => onSelectColor(color)}
                    style={{ touchAction: 'manipulation' }}
                    title={`Couleur ${color.name}`}
                    className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border-2 transition-all shadow-sm relative group color-dot color-bg-${color.hex.replace('#', '')} touch-target-44 active:scale-95 flex items-center justify-center ${
                      selectedColor.hex === color.hex ? 'active ring-2 ring-theme-primary ring-offset-2' : 'border-slate-200'
                    }`}
                  >
                      {selectedColor.hex === color.hex && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check size={16} className={['#FFFFFF', '#fff', '#ffffff'].includes(color.hex) ? 'text-black' : 'text-white'} />
                          </div>
                      )}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle pour cacher le motif d'origine */}
            {setHideBaseDesign && (
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between bg-white p-4 rounded-2xl border">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Cacher le motif d'origine</h3>
                  <p className="text-xs text-slate-500">Affiche le T-shirt vierge avec la couleur sélectionnée</p>
                </div>
                <button
                  onClick={() => setHideBaseDesign(!hideBaseDesign)}
                  style={{ touchAction: 'manipulation' }}
                  title="Basculer l'affichage du motif d'origine"
                  aria-label="Cacher le motif d'origine"
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center cursor-pointer ${hideBaseDesign ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform absolute ${hideBaseDesign ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. TEXTE */}
        {activeTab === 'text' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Ajouter un texte personnalisé</h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Votre message ici..."
                className="w-full p-4 border border-slate-200 rounded-2xl text-base text-slate-900 resize-none h-28 outline-none bg-slate-50 focus:bg-white transition-all theme-input-ring"
              />
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {FONTS.map(font => (
                  <button
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    style={{ touchAction: 'manipulation' }}
                    className={`shrink-0 px-4 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium whitespace-nowrap transition-all font-button touch-target-44 font-family-${font.replace(/\s+/g, '-')} ${
                      selectedFont === font ? 'active' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Aa {font}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { if (inputText) { onAddText(inputText, selectedFont); setInputText(''); } }}
                disabled={!inputText}
                style={{ touchAction: 'manipulation' }}
                className="w-full bg-slate-900 text-white min-h-[44px] py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-95 touch-target-44 cursor-pointer"
              >
                <Plus size={18} /> Ajouter au design
              </button>
            </div>
            
            {activeElement?.type === 'text' && (
              <div className="pt-6 border-t border-slate-200 space-y-4 bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modifier la sélection</h3>
                  <button 
                    onClick={() => onDeleteElement(activeElement.id)} 
                    title="Supprimer cet élément"
                    style={{ touchAction: 'manipulation' }}
                    className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-target-44"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <textarea
                  value={activeElement.content}
                  onChange={(e) => onUpdateElement(activeElement.id, { content: e.target.value })}
                  placeholder="Modifier votre texte..."
                  className="w-full p-4 border border-slate-200 rounded-2xl text-sm text-slate-900 resize-none h-20 outline-none bg-slate-50 focus:bg-white transition-all theme-input-ring focus:border-slate-300"
                />

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {FONTS.map(font => (
                    <button
                      key={font}
                      onClick={() => onUpdateElement(activeElement.id, { fontFamily: font })}
                      style={{ touchAction: 'manipulation' }}
                      className={`shrink-0 px-4 py-2.5 min-h-[44px] rounded-xl border text-xs font-medium whitespace-nowrap transition-all font-button touch-target-44 font-family-${font.replace(/\s+/g, '-')} ${
                        activeElement.fontFamily === font ? 'active' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Aa {font}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {['#000000', '#FFFFFF', '#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#9333EA'].map(c => (
                      <button 
                        key={c}
                        onClick={() => onUpdateElement(activeElement.id, { color: c })} 
                        style={{ touchAction: 'manipulation' }}
                        title={`Changer couleur en ${c}`}
                        className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border shadow-sm shrink-0 transition-transform active:scale-95 touch-target-44 color-bg-${c.replace('#', '')} ${activeElement.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                      />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. IMAGES */}
        {activeTab === 'image' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-slate-800">Vos Images</h3>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors group shadow-sm">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-full shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 mb-3 transition-all group-hover-theme-icon">
                  <ImageIcon size={28} />
                </div>
                <p className="mb-1 text-sm text-slate-800 font-bold">Toucher pour importer</p>
                <p className="text-xs text-slate-400">PNG, JPG (Max. 5Mo)</p>
              </div>
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleFileUpload} />
            </label>

            {activeElement?.type === 'image' && (
              <div className="pt-6 border-t border-slate-200 space-y-4 bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modifier sélection</h3>
                  <button 
                    onClick={() => onDeleteElement(activeElement.id)} 
                    style={{ touchAction: 'manipulation' }}
                    title="Supprimer l'image"
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. IA MAGIC (DALL-E & GEMINI) */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button 
                onClick={() => setAiSubTab('text')}
                style={{ touchAction: 'manipulation' }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all subtab-button cursor-pointer ${aiSubTab === 'text' ? 'active shadow-sm' : 'text-slate-500'}`}
              >
                SLOGANS
              </button>
              <button 
                onClick={() => setAiSubTab('image')}
                style={{ touchAction: 'manipulation' }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all subtab-button cursor-pointer ${aiSubTab === 'image' ? 'active shadow-sm' : 'text-slate-500'}`}
              >
                IMAGES IA
              </button>
            </div>

            <div className="p-5 rounded-2xl border ai-box bg-white shadow-sm">
              <div className="flex items-center gap-2 font-bold text-sm mb-4 text-theme-primary">
                <Sparkles size={18} />
                {aiSubTab === 'text' ? 'Générateur de Slogans' : 'Artiste IA (DALL-E)'}
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={aiSubTab === 'text' ? "Ex: Passion foot..." : "Ex: Lion géométrique..."}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-900 transition-all theme-input-ring shadow-sm"
                />
                <button
                  onClick={aiSubTab === 'text' ? handleAiTextSearch : handleAiImageGen}
                  disabled={isAiLoading || !aiPrompt}
                  style={{ touchAction: 'manipulation' }}
                  className="w-full text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 ai-button cursor-pointer"
                >
                  {isAiLoading ? <RefreshCw className="animate-spin" size={18}/> : (aiSubTab === 'text' ? 'Trouver des idées' : 'Générer l\'image')}
                </button>
              </div>
            </div>

            {/* Suggestions Texte */}
            {aiSubTab === 'text' && aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</h4>
                <div className="grid grid-cols-1 gap-2">
                    {aiSuggestions.map((s, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAddText(s, 'Inter')}
                        style={{ touchAction: 'manipulation' }}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 transition-all text-sm font-medium text-slate-700 shadow-sm bg-white active:scale-95 hover-theme-suggestion cursor-pointer"
                    >
                        "{s}"
                    </button>
                    ))}
                </div>
              </div>
            )}

            {/* APERÇU DE L'IMAGE GÉNÉRÉE */}
            {aiSubTab === 'image' && generatedImageUrl && !isAiLoading && (
              <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Résultat</h4>
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm aspect-square">
                  <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-contain p-4" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-100 flex items-end pb-4 md:items-center justify-center md:p-4">
                    <button 
                      onClick={() => onAddImage(generatedImageUrl)}
                      style={{ touchAction: 'manipulation' }}
                      className="bg-white px-5 py-2.5 md:px-6 md:py-3 rounded-full font-bold text-xs md:text-sm flex items-center gap-2 shadow-2xl transform active:scale-95 hover:scale-105 transition-transform text-theme-primary cursor-pointer"
                    >
                      <Plus size={18} /> Ajouter au T-shirt
                    </button>
                  </div>
                </div>
                <p className="text-xs text-center text-slate-400">Cliquez pour ajouter le visuel au t-shirt</p>
              </div>
            )}
          </div>
        )}

        {/* 5. CALQUES (LAYERS MANAGER) */}
        {activeTab === 'layers' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-theme-primary" /> Calques du Design
                </h3>
                <p className="text-xs text-slate-500">
                  {elements.length > 0 ? `${elements.length} élément(s) placé(s)` : 'Aucun élément pour l\'instant'}
                </p>
              </div>
              {elements.length > 1 && onReorderElements && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ordre</span>
              )}
            </div>

            {elements.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <Layers size={36} className="mx-auto text-slate-300" />
                <p className="text-sm text-slate-700 font-medium">Votre composition est vierge.</p>
                <p className="text-xs text-slate-400">Ajoutez du texte, importez un visuel ou générez une illustration par IA pour voir vos calques ici.</p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleTabClick('text')}
                    style={{ touchAction: 'manipulation' }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    + Texte
                  </button>
                  <button
                    onClick={() => handleTabClick('image')}
                    style={{ touchAction: 'manipulation' }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    + Image
                  </button>
                  <button
                    onClick={() => handleTabClick('ai')}
                    style={{ backgroundColor: 'var(--theme-primary)', touchAction: 'manipulation' }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm cursor-pointer"
                  >
                    + IA
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {elements.map((el, index) => {
                  const isSelected = activeElement?.id === el.id;
                  return (
                    <div
                      key={el.id}
                      onClick={() => onSelectElement && onSelectElement(el.id)}
                      style={{ touchAction: 'manipulation' }}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-theme-primary bg-white shadow-md ring-2 ring-theme-primary/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          el.type === 'text' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {el.type === 'text' ? <Type size={16} /> : <ImageIcon size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {el.type === 'text' ? `"${el.content}"` : (el.type === 'image' ? 'Visuel / Image' : 'Élément')}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            Calque #{index + 1} {el.type === 'text' && el.fontFamily ? `• ${el.fontFamily}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {onReorderElements && elements.length > 1 && (
                          <>
                            <button
                              onClick={() => {
                                if (index > 0) {
                                  const newArr = [...elements];
                                  const temp = newArr[index];
                                  newArr[index] = newArr[index - 1];
                                  newArr[index - 1] = temp;
                                  onReorderElements(newArr);
                                }
                              }}
                              disabled={index === 0}
                              style={{ touchAction: 'manipulation' }}
                              title="Déplacer vers l'arrière"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (index < elements.length - 1) {
                                  const newArr = [...elements];
                                  const temp = newArr[index];
                                  newArr[index] = newArr[index + 1];
                                  newArr[index + 1] = temp;
                                  onReorderElements(newArr);
                                }
                              }}
                              disabled={index === elements.length - 1}
                              style={{ touchAction: 'manipulation' }}
                              title="Déplacer vers l'avant"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ArrowUp size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDeleteElement(el.id)}
                          style={{ touchAction: 'manipulation' }}
                          title="Supprimer ce calque"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🪄 STYLES DYNAMIQUES */}
      <style>{`
        ${FONTS.map(f => `.font-family-${f.replace(/\s+/g, '-')} { font-family: '${f}', sans-serif; }`).join('\n')}
        ${colors.map(c => `.color-bg-${c.hex.replace('#', '')} { background-color: ${c.hex}; --ring-color: color-mix(in srgb, ${c.hex} 20%, transparent); }`).join('\n')}
        ${['#000000', '#FFFFFF', '#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#9333EA'].map(c => `.color-bg-${c.replace('#', '')} { background-color: ${c}; }`).join('\n')}

        .text-theme-primary {
            color: var(--theme-primary) !important;
        }
        .tab-button.active {
            color: var(--theme-primary) !important;
            border-bottom: 2px solid var(--theme-primary) !important;
        }
        .color-dot.active {
            scale: 1.1;
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px var(--ring-color) !important;
        }
        .font-button.active {
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            transform: scale(1.05);
            background-color: var(--theme-primary) !important;
            border-color: var(--theme-primary) !important;
            color: white !important;
        }
        .subtab-button.active {
            color: var(--theme-primary) !important;
            background-color: rgb(255 255 255 / 1);
        }
        .ai-box {
            background-color: color-mix(in srgb, var(--theme-primary) 5%, transparent);
            border-color: color-mix(in srgb, var(--theme-primary) 15%, transparent);
        }
        .ai-button {
            background-color: var(--theme-primary) !important;
            opacity: 0.95;
        }
        .ai-button:hover {
            opacity: 1;
        }
        .theme-input-ring:focus {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 20%, transparent) !important;
        }
        .group:hover .group-hover-theme-icon {
            color: var(--theme-primary) !important;
            border-color: color-mix(in srgb, var(--theme-primary) 20%, transparent) !important;
        }
        .hover-theme-suggestion:hover {
            border-color: color-mix(in srgb, var(--theme-primary) 30%, transparent) !important;
            background-color: color-mix(in srgb, var(--theme-primary) 5%, transparent) !important;
        }
      `}</style>
    </div>
  );
};

export default ToolsPanel;