import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  const phoneNumber = "2250172322727"; 
  const message = encodeURIComponent("Bonjour H-Designer, j'aimerais avoir un conseil pour ma personnalisation.");
  
  return (
    <a 
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group flex items-center gap-2 overflow-hidden max-w-[50px] md:max-w-[60px] hover:max-w-[200px] opacity-70 hover:opacity-100 backdrop-blur-sm"
      title="Besoin d'aide ?"
    >
      <MessageCircle size={28} />
      <span className="font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Aide WhatsApp</span>
    </a>
  );
};

export default WhatsAppButton;
