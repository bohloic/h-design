import React, { useState } from 'react';
import { Type, Image as ImageIcon, Sparkles, Plus, Trash2, Palette, Check, RefreshCw } from 'lucide-react';
import { ProductColor, DesignElement } from '../../../types';
import { getDesignSuggestions } from '../../../services/geminiService';
import { FONTS } from '../../constants';

interface ToolsPanelProps {
  onAddText: (text: string, font: string) => void;
  onAddImage: (url: string) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
  // La fonction doit maintenant retourner une Promise avec l'URL (string) ou null
  onAIGenerate: (prompt: string) => Promise<string | null>; 
  activeElement: DesignElement | null;
  colors: ProductColor[];
  selectedColor: ProductColor;
  onSelectColor: (c: ProductColor) => void;
}

type TabType = 'product' | 'text' | 'image' | 'ai';

const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  onAddText, 
  onAddImage, 
  onUpdateElement, 
  onDeleteElement,
  onAIGenerate,
  activeElement,
  colors = [], 
  selectedColor,
  onSelectColor
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  
  // AI State
  const [aiSubTab, setAiSubTab] = useState<'text' | 'image'>('text');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // NOUVEAU : On stocke l'image générée ici pour l'aperçu
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiTextSearch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const suggestions = await getDesignSuggestions(aiPrompt);
      setAiSuggestions(suggestions);
    } catch (error) { console.error(error); } 
    finally { setIsAiLoading(false); }
  };

  // --- LOGIQUE IMAGE ---
  const handleAiImageGen = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setGeneratedImageUrl(null); // Reset précédent
    try {
      // On attend la réponse du parent
      const url = await onAIGenerate(aiPrompt);
      if (url) {
          setGeneratedImageUrl(url); // On affiche l'aperçu
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) onAddImage(ev.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const tabs = [
    { id: 'product', icon: <Palette size={20} />, label: 'Couleur' },
    { id: 'text', icon: <Type size={20} />, label: 'Texte' },
    { id: 'image', icon: <ImageIcon size={20} />, label: 'Images' },
    { id: 'ai', icon: <Sparkles size={20} />, label: 'IA' },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col">
      
      {/* TABS */}
      <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all active:bg-gray-50 ${
              activeTab === tab.id ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-24 md:pb-5">
        
        {/* COULEUR */}
        {activeTab === 'product' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Palette size={16} className="text-red-500"/> Couleur du produit
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => onSelectColor(color)}
                    className={`aspect-square rounded-full border-2 transition-all shadow-sm relative group ${
                      selectedColor.hex === color.hex ? 'border-red-600 scale-110 ring-2 ring-red-100' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                      {selectedColor.hex === color.hex && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check size={14} className={['#FFFFFF', '#fff', '#ffffff'].includes(color.hex) ? 'text-black' : 'text-white'} />
                          </div>
                      )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEXTE */}
        {activeTab === 'text' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800">Ajouter un texte</h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Votre message ici..."
                className="w-full p-4 border border-gray-200 rounded-2xl text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none h-28 outline-none bg-gray-50 focus:bg-white transition-colors"
              />
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {FONTS.map(font => (
                  <button
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    className={`shrink-0 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                      selectedFont === font ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    Aa {font}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { if (inputText) { onAddText(inputText, selectedFont); setInputText(''); } }}
                disabled={!inputText}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-95"
              >
                <Plus size={18} /> Ajouter au design
              </button>
            </div>
            
            {activeElement?.type === 'text' && (
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Modifier texte</h3>
                  <button onClick={() => onDeleteElement(activeElement.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {['#000000', '#FFFFFF', '#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#9333EA'].map(c => (
                      <button 
                        key={c}
                        onClick={() => onUpdateElement(activeElement.id, { color: c })} 
                        className={`w-8 h-8 rounded-full border shadow-sm shrink-0 ${activeElement.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMAGE */}
        {activeTab === 'image' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-gray-800">Vos Images</h3>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 mb-3 group-hover:text-red-600 group-hover:border-red-100 transition-all">
                  <ImageIcon size={28} />
                </div>
                <p className="mb-1 text-sm text-gray-700 font-bold">Toucher pour importer</p>
                <p className="text-xs text-gray-400">PNG, JPG (Max. 5Mo)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
             {activeElement?.type === 'image' && (
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-red-50 p-4 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-bold text-red-700">Image sélectionnée</span>
                  <button onClick={() => onDeleteElement(activeElement.id)} className="flex items-center gap-2 text-red-600 bg-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-red-100">
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IA */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button 
                onClick={() => setAiSubTab('text')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${aiSubTab === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
              >
                SLOGANS
              </button>
              <button 
                onClick={() => setAiSubTab('image')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${aiSubTab === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
              >
                IMAGES IA
              </button>
            </div>

            <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-4">
                <Sparkles size={18} />
                {aiSubTab === 'text' ? 'Générateur de Slogans' : 'Artiste IA (DALL-E)'}
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={aiSubTab === 'text' ? "Ex: Passion foot..." : "Ex: Lion géométrique..."}
                  className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <button
                  onClick={aiSubTab === 'text' ? handleAiTextSearch : handleAiImageGen}
                  disabled={isAiLoading || !aiPrompt}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md border border-indigo-100 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isAiLoading ? <RefreshCw className="animate-spin" size={18}/> : (aiSubTab === 'text' ? 'Trouver des idées' : 'Générer l\'image')}
                </button>
              </div>
            </div>

            {/* Suggestions Texte */}
            {aiSubTab === 'text' && aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suggestions</h4>
                <div className="grid grid-cols-1 gap-2">
                    {aiSuggestions.map((s, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAddText(s, 'Inter')}
                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-sm font-medium text-gray-700 shadow-sm bg-white active:scale-95"
                    >
                        "{s}"
                    </button>
                    ))}
                </div>
              </div>
            )}

            {/* --- APERÇU DE L'IMAGE GÉNÉRÉE (Ce que vous vouliez) --- */}
            {aiSubTab === 'image' && generatedImageUrl && !isAiLoading && (
              <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Résultat</h4>
                <div className="relative group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm aspect-square">
                  {/* L'image s'affiche ici */}
                  <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-contain p-4" />
                  
                  {/* Bouton Ajouter au survol */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <button 
                      onClick={() => onAddImage(generatedImageUrl)}
                      className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl transform hover:scale-105 transition-transform"
                    >
                      <Plus size={18} /> Ajouter au T-shirt
                    </button>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-400">Cliquez sur l'image pour l'ajouter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPanel;