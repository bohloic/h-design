import React, { useState, useEffect } from 'react';
import { Header } from "../components/admin/Header";
import { Sidebar } from "../components/admin/Sidebar";
import { Menu, LogOut, Store } from 'lucide-react';
import { NotificationDropdown } from '../components/elements/NotificationDropdown.tsx';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/context/ThemeContext.tsx';

export const AppLayout = ({ children, title }: { children?: React.ReactNode; title: string }) => {
  const navigate = useNavigate();
  // État pour gérer l'ouverture/fermeture de la sidebar sur mobile
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // État pour gérer la réduction de la sidebar sur PC
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch { return false; }
  });

  const { themeMode } = useTheme();

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // 🔒 ISOLATION DU THÈME : L'Admin est TOUJOURS en mode clair
  useEffect(() => {
    document.documentElement.classList.remove('dark');

    return () => {
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
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- 2. SIDEBAR RESPONSIVE & COLLAPSIBLE (FIXE 100% HAUTEUR) --- */}
      <aside className={`
        fixed top-0 left-0 bottom-0 h-screen z-50 bg-slate-900 border-r border-slate-800 shadow-xl lg:shadow-none
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}>
        <div className="h-full">
            <Sidebar 
              onClose={() => setSidebarOpen(false)} 
              isCollapsed={isCollapsed}
              onToggleCollapse={handleToggleCollapse}
            /> 
        </div>
      </aside>

      {/* --- 3. CONTENU PRINCIPAL (DÉFILEMENT INDÉPENDANT) --- */}
      <main className={`flex-1 h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        
        {/* Header Mobile */}
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    title="Ouvrir le menu"
                    aria-label="Ouvrir le menu latéral"
                >
                    <Menu size={24} />
                </button>
                <h1 className="font-bold text-lg text-slate-800 truncate max-w-[140px] sm:max-w-none">{title}</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <button 
                    onClick={() => navigate('/')}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    title="Aller sur la boutique"
                >
                    <Store size={20} />
                </button>

                <NotificationDropdown />

                <button 
                    onClick={handleLogout}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Déconnexion"
                >
                    <LogOut size={20} />
                    <span className="text-xs font-bold sm:inline hidden">Déconnexion</span>
                </button>
            </div>
        </div>

        {/* Header Desktop */}
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