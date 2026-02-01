import { TrendingUp, LucideIcon } from "lucide-react";

// On définit les styles de couleurs explicitement pour que Tailwind les détecte
const colorStyles: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  rose: 'bg-rose-50 text-rose-600',
  default: 'bg-slate-50 text-slate-600'
};

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon; // Typage correct pour une icône Lucide
  color: string;
}

export const StatCard = ({ label, value, trend, icon: Icon, color }: StatCardProps) => {
  
  // On récupère les classes basées sur la prop couleur, ou le défaut
  const colorClass = colorStyles[color] || colorStyles.default;
  
  // Détection de la tendance (positive ou négative) pour la couleur du texte
  const isPositive = trend.startsWith('+');
  const trendColor = isPositive ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow duration-300">
      <div className="flex-1 min-w-0"> {/* min-w-0 permet au truncate de fonctionner */}
        <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 truncate">
          {label}
        </p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
          {value}
        </h3>
        
        <div className={`mt-2 flex items-center gap-1 text-xs sm:text-sm font-bold ${trendColor}`}>
          <TrendingUp 
            size={16} 
            className={`transition-transform duration-300 ${!isPositive ? 'rotate-180' : ''}`} 
          />
          <span>{trend}</span>
          <span className="text-slate-400 font-normal hidden sm:inline">vs mois dernier</span>
        </div>
      </div>
      
      <div className={`p-3 sm:p-4 rounded-xl flex-shrink-0 ${colorClass}`}>
        <Icon size={24} className="sm:w-7 sm:h-7" />
      </div>
    </div>
  );
};