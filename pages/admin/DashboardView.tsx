import * as mockService from '../../services/mockService'
import { analyzeSales } from '../../services/geminiService';
import {useState, useEffect} from 'react'
import { StatCard } from '@/src/components/admin/StatCard';
import { CheckCircle2, LayoutDashboard, ShoppingBag, TrendingUp, Users, Sparkles } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';

export const DashboardView = () => {
  const [products] = useState(mockService.getProducts());
  const [orders] = useState(mockService.getOrders());
  const [aiTips, setAiTips] = useState<string[]>([]);

  useEffect(() => {
    analyzeSales(orders, products).then(setAiTips);
  }, []);

  const chartData = [
    { name: 'Lun', sales: 400, orders: 12 },
    { name: 'Mar', sales: 300, orders: 8 },
    { name: 'Mer', sales: 600, orders: 15 },
    { name: 'Jeu', sales: 800, orders: 20 },
    { name: 'Ven', sales: 700, orders: 18 },
    { name: 'Sam', sales: 900, orders: 25 },
    { name: 'Dim', sales: 1100, orders: 32 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* 1. CARTES STATISTIQUES (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Chiffre d'Affaires" value="24 500 €" trend="+12.5%" icon={ShoppingBag} color="red" />
        <StatCard label="Commandes" value="342" trend="+8.2%" icon={CheckCircle2} color="emerald" />
        <StatCard label="Nouveaux Clients" value="56" trend="+14.1%" icon={Users} color="sky" />
        <StatCard label="Panier Moyen" value="71.60 €" trend="-2.4%" icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* 2. GRAPHIQUE DES VENTES */}
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Performance des Ventes</h3>
            <select className="bg-slate-50 border-none text-sm font-medium rounded-lg px-3 py-2 outline-none w-full sm:w-auto">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          
          {/* Container responsive pour le graphique (plus petit sur mobile) */}
          <div className="h-56 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', color: '#dc2626' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. INSIGHTS IA (Sidebar Droite) */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm text-red-400">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-lg">Insights IA Gemini</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Analyse automatique de vos performances et recommandations.
            </p>
            <div className="space-y-3">
              {aiTips.length > 0 ? aiTips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-900/50">{idx + 1}</span>
                  <p className="text-xs sm:text-sm text-slate-200">{tip}</p>
                </div>
              )) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                </div>
              )}
            </div>
          </div>
          
          <button className="relative z-10 mt-8 w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95">
            Générer un rapport complet
          </button>
          
          {/* Formes décoratives en arrière-plan */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[40px] -ml-16 -mb-16 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};