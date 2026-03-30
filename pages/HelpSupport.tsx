import React, { useState } from 'react';
import { 
  HelpCircle, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  MessageSquare, 
  Mail, 
  Phone, 
  ChevronRight,
  ShieldCheck,
  Search,
  Inbox
} from 'lucide-react';

import { useChatStore } from '@/src/store/useChatStore';

const HelpSupport: React.FC = () => {
  const { openChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: "Comment suivre ma commande ?",
      answer: "Une fois votre commande expédiée, vous recevrez un e-mail avec un numéro de suivi. Vous pouvez également suivre vos commandes depuis votre tableau de bord dans la section 'Mes Commandes'."
    },
    {
      question: "Quels sont les délais de livraison ?",
      answer: "À Abidjan, nous livrons en 24h à 48h. Pour l'intérieur du pays, comptez 3 à 5 jours ouvrés. Les produits personnalisés peuvent nécessiter 24h supplémentaires de production."
    },
    {
      question: "Puis-je modifier ou annuler ma commande ?",
      answer: "Vous pouvez annuler votre commande tant qu'elle n'est pas passée en statut 'En préparation'. Pour les produits personnalisés, aucune modification n'est possible après le début de l'impression."
    },
    {
      question: "Comment retourner un article ?",
      answer: "Pour retourner un article (hors produits personnalisés), contactez notre SAV dans les 7 jours suivant la réception. L'article doit être dans son emballage d'origine et non porté."
    }
  ];

  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredFaqs = faqs.filter(faq => {
    const search = normalize(searchQuery);
    return normalize(faq.question).includes(search) || normalize(faq.answer).includes(search);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-carbon pt-24 pb-16 font-sans transition-colors">
      {/* Search / Hero Area */}
      <section className="container mx-auto px-4 mb-12">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">
            Centre d'Aide & <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, var(--theme-primary), #facc15)' }}>SAV</span>
          </h1>
          {!searchQuery && (
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 relative z-10 animate-in fade-in duration-500">
              Trouvez des réponses à vos questions ou contactez notre équipe support pour une assistance personnalisée.
            </p>
          )}

          <div className={`max-w-xl mx-auto relative z-10 ${searchQuery ? 'mb-4' : ''} transition-all duration-300`}>
            <div className={`bg-white dark:bg-slate-800 rounded-2xl p-2 flex items-center shadow-2xl border-2 ${searchQuery ? 'border-[var(--theme-primary)]' : 'border-transparent dark:border-slate-700'} transition-all`}>
              <Search className="text-slate-400 ml-4" />
              <input 
                type="text" 
                placeholder="Comment pouvons-nous vous aider ?" 
                className="flex-grow px-4 py-3 bg-transparent border-none outline-none text-slate-900 dark:text-pure placeholder:text-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 px-4 font-bold text-sm uppercase"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>

          {/* Search Results right here if searching */}
          {searchQuery && (
            <div className="relative z-10 mt-8 max-w-3xl mx-auto text-left animate-in slide-in-from-top-4 duration-500">
               <div className="bg-white/5 backdrop-blur-md rounded-3xl p-1 border border-white/10 overflow-hidden shadow-2xl">
                 <div className="p-6 border-b border-white/5 flex justify-between items-center text-white">
                    <span className="font-bold uppercase tracking-widest text-xs opacity-70">
                      Résultats (${filteredFaqs.length})
                    </span>
                 </div>
                 <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-6 space-y-4">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((faq, idx) => (
                        <div key={idx} className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl transition-all border border-white/10 group cursor-default">
                          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                             <HelpCircle size={18} style={{ color: 'var(--theme-primary)' }} />
                             {faq.question}
                          </h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <Inbox size={48} className="mx-auto text-slate-500 mb-4" />
                        <p className="text-slate-400 font-medium">Désolé, aucun résultat pour votre recherche.</p>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          )}
        </div>
      </section>

      {!searchQuery && (
        <>
          {/* Quick Links / Categories - Only shown when NOT searching */}
          <section className="container mx-auto px-4 mb-16 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Truck size={32} />, title: "Livraison", desc: "Suivi et délais d'expédition" },
                { icon: <RotateCcw size={32} />, title: "Retours", desc: "Conditions et procédures" },
                { icon: <CreditCard size={32} />, title: "Paiements", desc: "Modes de paiement acceptés" },
                { icon: <ShieldCheck size={32} />, title: "Garanties", desc: "Qualité et service H-Designer" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-pure mb-2">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQs - Default View */}
          <section className="container mx-auto px-4 mb-16 animate-in fade-in duration-700">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <HelpCircle size={28} style={{ color: 'var(--theme-primary)' }} />
                <h2 className="text-3xl font-black text-slate-900 dark:text-pure uppercase">Questions Fréquentes</h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <details key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm group">
                    <summary className="p-6 cursor-pointer list-none flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-pure text-lg">{faq.question}</span>
                      <ChevronRight size={20} className="text-slate-400 dark:text-slate-500 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-slate-700 pt-4">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Contact Section */}
      <section className="container mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col md:flex-row transition-colors">
          <div className="p-8 md:p-16 flex-grow">
            <h2 className="text-3xl font-black text-slate-900 dark:text-pure mb-6 font-sans">Vous ne trouvez pas votre réponse ?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Notre équipe est à votre disposition pour vous aider dans les plus brefs délais.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-slate-900 text-white">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-pure">Par téléphone</h4>
                  <p className="text-slate-500 dark:text-slate-400">+225 01 72 32 27 27</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Lun - Sam, 9h - 19h</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-slate-900 text-white">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-pure">Par e-mail</h4>
                  <p className="text-slate-500 dark:text-slate-400">support@h-designer.ci</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Réponse en moins de 24h</p>
                </div>
              </div>
            </div>

            <button 
              onClick={openChat}
              className="mt-12 group bg-slate-900 text-white px-8 py-4 rounded-full font-black text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3"
            >
              <MessageSquare size={20} className="group-hover:rotate-12 transition-transform" />
              Démarrer le Chat
            </button>
          </div>
          
          <div className="bg-slate-900 p-8 md:p-16 text-white md:w-1/3 flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-6">Nos Engagements</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <ShieldCheck size={24} style={{ color: 'var(--theme-primary)' }} className="shrink-0" />
                <p className="text-slate-300 text-sm">Confidentialité de vos données garantie par cryptage SSL.</p>
              </li>
              <li className="flex items-start gap-4">
                <Truck size={24} style={{ color: 'var(--theme-primary)' }} className="shrink-0" />
                <p className="text-slate-300 text-sm">Suivi temps réel de votre colis d'expédition.</p>
              </li>
              <li className="flex items-start gap-4">
                <RotateCcw size={24} style={{ color: 'var(--theme-primary)' }} className="shrink-0" />
                <p className="text-slate-300 text-sm">Échange simplifié si la taille ne convient pas.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <style>{`
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default HelpSupport;
