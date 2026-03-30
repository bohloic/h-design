import React, { useState, useEffect } from 'react';
import { Header } from "../components/admin/Header";
import { Sidebar } from "../components/admin/Sidebar";
import { Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/context/ThemeContext.tsx';

export const AppLayout = ({ children, title }: { children?: React.ReactNode; title: string }) => {
  const navigate = useNavigate();
  // État pour gérer l'ouverture/fermeture de la sidebar sur mobile
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { themeMode } = useTheme();

  // 🔒 ISOLATION DU THÈME : L'Admin est TOUJOURS en mode clair
  useEffect(() => {
    const isDarkAtEntry = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');

    return () => {
      // On restaure le mode sombre uniquement si c'était le choix global de l'utilisateur
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
  }, [themeMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    navigate('/login');
    window.location.href = '/login';
  };

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
        


        {/* On inclut ton composant Sidebar existant ici */}
        {/* Note: Ta Sidebar doit juste contenir les liens, le container externe est géré ici */}
        <div className="h-full overflow-y-auto">
            <Sidebar onClose={() => setSidebarOpen(false)} /> 
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
            {/* Bouton déconnexion mobile */}
            <button 
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                title="Déconnexion"
            >
                <LogOut size={20} />
                <span className="text-xs font-bold sm:inline hidden">Déconnexion</span>
            </button>
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