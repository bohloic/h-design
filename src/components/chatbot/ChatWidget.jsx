import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, X, Send, Bot, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/src/utils/apiClient';
import { BASE_IMG_URL } from '@/src/components/images/VoirImage'; 

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Bonjour ! Je suis l'IA de **H-Design**. Dites-moi ce que vous cherchez (ex: 'Sacs à main' ou 'T-shirt XL').", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 🪄 Correction 1 : On enlève <HTMLDivElement>
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  // 🪄 Correction 2 : On enlève : React.FormEvent
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userMessage,
            history: messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }))
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, { 
          text: data.text || data.reply || "Désolé, je n'ai pas compris.", 
          sender: 'bot',
          products: data.products || [] 
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Je n'arrive pas à joindre le serveur.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🪄 Correction 3 : On enlève : any
  const handleProductClick = (product) => {
      setIsOpen(false);
      const identifier = product.slug || product.id;
      navigate(`/boutique/produit/${identifier}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {isOpen && (
        <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div 
            className="p-4 flex justify-between items-center text-white shadow-md transition-colors duration-500"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full"><Bot size={18} /></div>
              <div>
                <h3 className="font-bold text-sm">Assistant H-Design</h3>
                <p className="text-[10px] text-white/80 uppercase tracking-wider flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> En ligne
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors"><X size={18} /></button>
          </div>

          {/* Zone Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
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
                              strong: ({node, ...props}) => <strong {...props} className="font-black text-slate-900" />,
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
                      <div key={product.id} className="snap-center shrink-0 w-36 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
                        <div className="h-28 bg-white relative p-2">
                            <img 
                                src={product.image_url ? (BASE_IMG_URL + product.image_url) : "/placeholder.png"} 
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="p-2 flex flex-col flex-1 border-t border-slate-50">
                            <h4 className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight h-8">{product.name}</h4>
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
              <div className="flex items-center gap-1 bg-white p-3 rounded-2xl rounded-tl-none w-fit shadow-sm border border-slate-100">
                <Loader2 className="animate-spin text-slate-400" size={16} />
                <span className="text-xs text-slate-400">L'IA réfléchit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Je cherche un article..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 outline-none placeholder:text-slate-400 transition-all theme-input-ring"
            />
            <button 
              type="submit" 
              disabled={!input.trim()} 
              style={{ backgroundColor: 'var(--theme-primary)' }}
              className="text-white p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      {/* Bouton Flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: 'var(--theme-primary)' }}
        className="text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 relative"
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