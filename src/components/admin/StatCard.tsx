import { TrendingUp, LucideIcon } from "lucide-react";

// 🪄 Ajout de l'option 'theme' dans le typage
const colorStyles: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  rose: 'bg-rose-50 text-rose-600',
  default: 'bg-slate-50 text-slate-600',
  theme: '' // Sera géré dynamiquement via l'attribut style
};

interface StatCardProps {
  label: string;
  value: string | number; 
  trend: string; 
  icon: LucideIcon;
  color: keyof typeof colorStyles; 
  periodText?: string; 
}

export const StatCard = ({ label, value, trend, icon: Icon, color, periodText = "vs période précédente" }: StatCardProps) => {
  
  // On vérifie si la carte doit utiliser la couleur du thème dynamique
  const isTheme = color === 'theme';
  const colorClass = isTheme ? '' : (colorStyles[color] || colorStyles.default);
  
  // On s'assure que la tendance est traitée correctement (Couleurs sémantiques strictes)
  const isPositive = trend.startsWith('+');
  const trendColor = isPositive ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow duration-300">
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 truncate">
          {label}
        </p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
          {value}
        </h3>
        
        {/* On n'affiche la zone de tendance que s'il y a une valeur */}
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-xs sm:text-sm font-bold ${trendColor}`}>
            <TrendingUp 
              size={16} 
              className={`transition-transform duration-300 ${!isPositive ? 'rotate-180' : ''}`} 
            />
            <span>{trend}</span>
            <span className="text-slate-400 font-normal hidden sm:inline ml-1">
              {periodText}
            </span>
          </div>
        )}
      </div>
      
      {/* 🪄 GESTION DYNAMIQUE DE L'ICONE */}
      <div 
        className={`p-3 sm:p-4 rounded-xl flex-shrink-0 ${colorClass}`}
        style={isTheme ? { 
            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', 
            color: 'var(--theme-primary)' 
        } : {}}
      >
        <Icon size={24} className="sm:w-7 sm:h-7" />
      </div>
    </div>
  );
};