import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, X, Send, Bot, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/utils/apiClient';
import { BASE_IMG_URL } from '@/components/images/VoirImage';

import { useChatStore } from '@/store/useChatStore';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  products?: any[];
}

const ChatWidget: React.FC = () => {
  const { isOpen, setIsOpen } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([
    { text: "Bonjour ! Je suis l'assistant **H-Designer**. Comment puis-je vous aider ? (ex: 'Quelles sont vos catégories ?' ou 'Je cherche un T-shirt XL')", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  // 🎯 Focus l'input automatiquement quand le chat s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sanitizeBotResponse = (text: string): string => {
    if (!text) return "Bonjour ! Je suis l'assistant virtuel H-Designer. Comment puis-je vous aider aujourd'hui ?";
    
    return text
      .replace(/La Boutique de Noël/gi, 'H-Designer')
      .replace(/Boutique de Noël/gi, 'H-Designer')
      .replace(/Père Noël/gi, "l'équipe H-Designer")
      .replace(/pour Noël/gi, 'pour votre style et vos événements')
      .replace(/cadeau de Noël/gi, 'cadeau personnalisé H-Designer')
      .replace(/cadeau parfait pour les fêtes/gi, 'cadeau sur-mesure idéal')
      .replace(/pour les fêtes/gi, 'pour vos proches')
      .replace(/les fêtes/gi, 'vos moments d\'exception')
      .replace(/🎄/g, '✨')
      .replace(/🎅/g, '👕');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput("");
    setIsLoading(true);

    // Détection de fautes / saisie incohérente répétitive (ex: nbnbnbb, vjhhjvhj)
    const isTypoOrGibberish = /^[b-df-hj-np-tv-z]{5,}$/i.test(userMessage.replace(/\s+/g, '')) || 
                              /(.)\1{4,}/i.test(userMessage);

    try {
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `[SYSTÈME: Tu es l'assistant virtuel de la marque H-Designer (T-shirts, Sweats, Mugs, casquettes personnalisables). Tu réponds poliment en français. NE MENTIONNE JAMAIS LA BOUTIQUE DE NOËL, NI LE PÈRE NOËL, NI LES FÊTES DE NOËL.]\n\nQuestion client: ${userMessage}`
        })
      });

      if (!response || !response.ok) {
        throw new Error("Erreur de réponse");
      }

      const data = await response.json();
      let rawText = data.text || data.reply || data.message || "";

      if (isTypoOrGibberish && (!rawText || rawText.toLowerCase().includes('noël'))) {
        rawText = "Il semble y avoir une petite coquille dans votre message ! 😊 Pas de souci, je suis là pour vous aider à trouver ou personnaliser vos articles H-Designer (T-shirts, Mugs, Sweats). Que souhaitez-vous créer aujourd'hui ?";
      }

      setMessages(prev => [...prev, { 
        text: sanitizeBotResponse(rawText), 
        sender: 'bot',
        products: data.products || [] 
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      const fallbackMsg = isTypoOrGibberish 
        ? "Oups ! Il semble y avoir eu une petite faute de frappe dans votre message. Dites-moi ce que vous recherchez parmi nos T-shirts, Mugs ou Sweats personnalisables !"
        : "Je suis l'assistant H-Designer. Je rencontre une petite lenteur réseau, mais je reste à votre disposition pour vous conseiller sur nos vêtements et mugs personnalisables ! ✨";

      setMessages(prev => [...prev, { text: fallbackMsg, sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: any) => {
      setIsOpen(false);
      const identifier = product.slug || product.id;
      navigate(`/boutique/produit/${identifier}`);
  };

  return (
    // 🔑 sticky bottom — fixé sur mobile et desktop, visible même après défilement
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[1002] flex flex-col items-end font-sans">
      
      {isOpen && (
        <div className="bg-white w-[calc(100vw-2rem)] md:w-96 h-[75vh] max-h-[600px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div 
            className="p-4 flex justify-between items-center text-white shadow-md transition-colors duration-500 flex-shrink-0"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full"><Bot size={18} /></div>
              <div>
                <h3 className="font-bold text-sm">Assistant H-Designer</h3>
                <p className="text-[10px] text-white/80 uppercase tracking-wider flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> En ligne
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              onTouchEnd={(e) => { e.preventDefault(); setIsOpen(false); }}
              aria-label="Fermer le chat"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors cursor-pointer relative z-50 touch-target-44 active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          {/* Zone Messages — flex-1 + overflow pour que le chat défile sans pousser l'input */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 transition-colors min-h-0">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                  
                  {msg.sender === 'user' ? (
                      msg.text
                  ) : (
                      <ReactMarkdown 
                          components={{
                              a: ({node, ...props}) => (
                                  <a {...props} style={{ color: 'var(--theme-primary)' }} className="font-bold underline hover:opacity-80 transition-opacity" rel="noopener noreferrer" />
                              ),
                              p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                              strong: ({node, ...props}) => <strong {...props} className="font-black text-slate-900 dark:text-white" />,
                              ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 mb-2 space-y-1" />,
                              li: ({node, ...props}) => (
                                <li {...props} className="theme-marker" />
                              )
                          }}
                      >
                          {msg.text}
                      </ReactMarkdown>
                  )}
                </div>

                {/* CARROUSEL PRODUITS */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 w-full overflow-x-auto pb-2 flex gap-3 snap-x no-scrollbar">
                    {msg.products.map((product) => (
                      <div key={product.id} className="snap-center shrink-0 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-md transition-all">
                        <div className="h-28 bg-white relative p-2">
                            <img 
                                src={product.image_url ? (BASE_IMG_URL + product.image_url) : "/placeholder.png"} 
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="p-2 flex flex-col flex-1 border-t border-slate-50 dark:border-slate-700">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight h-8">{product.name}</h4>
                            <p 
                              className="text-xs font-bold mt-1"
                              style={{ color: 'var(--theme-primary)' }}
                            >
                              {product.price} FCFA
                            </p>
                            
                            <button 
                                onClick={() => handleProductClick(product)} 
                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                className="mt-2 w-full text-white text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                            >
                                Voir <ArrowRight size={10} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none w-fit shadow-sm border border-slate-100 dark:border-slate-700">
                <Loader2 className="animate-spin text-slate-400" size={16} />
                <span className="text-xs text-slate-400">L'assistant réfléchit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — flex-shrink-0 pour qu'il reste toujours visible en bas */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 outline-none placeholder:text-slate-400 transition-all theme-input-ring"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading} 
              style={{ backgroundColor: 'var(--theme-primary)' }}
              className="text-white p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: 'var(--theme-primary)' }}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        className={`min-w-[48px] min-h-[48px] flex items-center justify-center text-white p-3 md:p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 relative z-50 backdrop-blur-sm cursor-pointer touch-target-44 ${!isOpen ? 'opacity-70 hover:opacity-100' : 'opacity-100'}`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span 
            className="absolute top-0 right-0 w-3 h-3 rounded-full animate-ping"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          ></span>
        )}
      </button>

      <style>{`
        .theme-input-ring:focus {
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 20%, transparent) !important;
        }
        .theme-marker::marker {
            color: var(--theme-primary);
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
