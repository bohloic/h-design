import { Bell, Search } from "lucide-react";

export const Header = ({ title }: { title: string }) => (
  <header className="h-16 glass-effect sticky top-0 z-10 px-8 flex items-center justify-between">
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    <div className="flex items-center gap-6">
      
      <div className="relative group">
        <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within-theme" 
            size={18} 
        />
        <input 
          type="text" 
          placeholder="Rechercher..." 
          className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 transition-all outline-none theme-input"
        />
      </div>

      <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
        <Bell size={20} />
        {/* Le point de notification reste rouge car c'est une alerte universelle */}
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>

      <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">Admin</p>
          <p className="text-xs text-slate-500">Super utilisateur</p>
        </div>
        <img 
            src="https://picsum.photos/seed/admin/100/100" 
            className="w-10 h-10 rounded-full object-cover border-2" 
            alt="Avatar" 
            // 🪄 BORDURE AVATAR DYNAMIQUE
            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
        />
      </div>
    </div>

    {/* 🪄 STYLE DYNAMIQUE POUR LE FOCUS DE LA RECHERCHE */}
    <style>{`
        .group:focus-within .group-focus-within-theme {
            color: var(--theme-primary) !important;
        }
        .theme-input:focus {
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 40%, transparent) !important;
        }
    `}</style>
  </header>
);