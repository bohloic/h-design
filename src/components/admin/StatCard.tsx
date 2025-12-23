import { TrendingUp } from "lucide-react";

// Added proper typing for StatCard props to avoid 'any'
export const StatCard = ({ label, value, trend, icon: Icon, color }: { 
  label: string; 
  value: string; 
  trend: string; 
  icon: any; 
  color: string; 
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
        <TrendingUp size={14} className={trend.startsWith('-') ? 'rotate-180' : ''} />
        {trend} vs mois dernier
      </div>
    </div>
    <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
      <Icon size={24} />
    </div>
  </div>
);
