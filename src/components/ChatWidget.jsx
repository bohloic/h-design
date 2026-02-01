import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/apiClient';

// ✅ CORRECTION 1 : L'import manquant !
// Assure-toi que le chemin est bon par rapport à l'emplacement de ton fichier ChatWidget
import { BASE_IMG_URL } from './images/VoirImage'; 

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Bonjour ! Je suis l'IA de H-Design. Dites-moi ce que vous cherchez (ex: 'T-shirt rouge en XL').", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

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
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      setMessages(prev => [...prev, { 
          text: data.reply, 
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

  // Fonction pour gérer le clic sur un produit
  const handleProductClick = (product) => {
      setIsOpen(false); // Ferme le chat
      // ✅ CORRECTION 2 : On utilise le SLUG s'il existe, sinon l'ID
      const identifier = product.slug || product.id;
      const link = `/boutique/produit/${identifier}`;
      navigate(link);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {isOpen && (
        <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-full"><Bot size={18} /></div>
              <div>
                <h3 className="font-bold text-sm">Assistant H-Design</h3>
                <p className="text-[10px] text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> En ligne
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={18} /></button>
          </div>

          {/* Zone Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Bulle de texte */}
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                  {msg.text}
                </div>

                {/* CARROUSEL PRODUITS (Si le message en contient) */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 w-full overflow-x-auto pb-2 flex gap-3 snap-x no-scrollbar">
                    {msg.products.map((product) => (
                      <div key={product.id} className="snap-center shrink-0 w-36 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all">
                        {/* Image */}
                        <div className="h-28 bg-white relative p-2">
                            <img 
                                src={product.image_url ? (BASE_IMG_URL + product.image_url) : "/placeholder.png"} 
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {/* Infos */}
                        <div className="p-2 flex flex-col flex-1 border-t border-slate-50">
                            <h4 className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight h-8">{product.name}</h4>
                            <p className="text-xs text-red-600 font-bold mt-1">{product.price} FCFA</p>
                            
                            <button 
                                onClick={() => handleProductClick(product)} 
                                className="mt-2 w-full bg-slate-900 text-white text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-slate-700 transition-colors"
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
                <span className="text-xs text-slate-400">Recherche en cours...</span>
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
              placeholder="Je cherche..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-400"
            />
            <button type="submit" disabled={!input.trim()} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors">
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      {/* Bouton Flottant (Pulsation si fermé) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl shadow-slate-400/50 transition-all hover:scale-110 active:scale-95 relative"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
      </button>

    </div>
  );
};

export default ChatWidget;