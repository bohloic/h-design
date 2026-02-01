import React, { useState } from 'react';
import { Header } from "../components/admin/Header";
import { Sidebar } from "../components/admin/Sidebar";
import { Menu, X } from 'lucide-react'; // Assure-toi d'avoir ces icônes

export const AppLayout = ({ children, title }: { children?: React.ReactNode; title: string }) => {
  // État pour gérer l'ouverture/fermeture de la sidebar sur mobile
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* --- 1. OVERLAY MOBILE (Fond noir transparent) --- */}
      {/* S'affiche uniquement si la sidebar est ouverte sur mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- 2. SIDEBAR RESPONSIVE --- */}
      {/* - fixed inset-y-0 : Toujours fixée en hauteur
          - z-50 : Au dessus de tout
          - w-64 : Largeur fixe
          - transform transition-transform : Animation fluide
          - Mobile (défaut) : -translate-x-full (cachée à gauche) sauf si isSidebarOpen est true
          - Desktop (lg) : translate-x-0 (toujours visible)
      */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* En-tête de la Sidebar Mobile (avec bouton fermer) */}
        <div className="flex justify-between items-center p-4 lg:hidden border-b border-slate-100">
            <span className="font-bold text-lg text-slate-800">Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <X size={24} />
            </button>
        </div>

        {/* On inclut ton composant Sidebar existant ici */}
        {/* Note: Ta Sidebar doit juste contenir les liens, le container externe est géré ici */}
        <div className="h-full overflow-y-auto">
            <Sidebar /> 
        </div>
      </aside>

      {/* --- 3. CONTENU PRINCIPAL --- */}
      {/* lg:ml-64 : Laisse la place à la sidebar sur PC. Sur mobile : ml-0 */}
      <main className="flex-1 min-h-screen transition-all duration-300 lg:ml-64">
        
        {/* Header Mobile (Barre supérieure visible uniquement sur mobile) */}
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <h1 className="font-bold text-lg text-slate-800 truncate">{title}</h1>
            </div>
            {/* Tu peux ajouter l'avatar admin ici si tu veux */}
        </div>

        {/* Header Desktop (Ton composant Header existant) */}
        <div className="hidden lg:block">
             <Header title={title} />
        </div>

        {/* Le contenu de la page */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};