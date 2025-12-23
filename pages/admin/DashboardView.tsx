import * as mockService from '../../services/mockService'
import { analyzeSales } from '../../services/geminiService';
import {useState, useEffect} from 'react'
import { StatCard } from '@/src/components/admin/StatCard';
import { CheckCircle2, LayoutDashboard, ShoppingBag, TrendingUp, Users } from 'lucide-react';
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
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Chiffre d'Affaires" value="24 500 €" trend="+12.5%" icon={ShoppingBag} color="indigo" />
        <StatCard label="Commandes" value="342" trend="+8.2%" icon={CheckCircle2} color="emerald" />
        <StatCard label="Nouveaux Clients" value="56" trend="+14.1%" icon={Users} color="sky" />
        <StatCard label="Panier Moyen" value="71.60 €" trend="-2.4%" icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Performance des Ventes</h3>
            <select className="bg-slate-50 border-none text-sm font-medium rounded-lg px-3 py-2 outline-none">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="h-96 w-full bg-white p-4 rounded-lg shadow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <LayoutDashboard size={18} />
              </div>
              <h3 className="font-bold text-lg">Insights IA Gemini</h3>
            </div>
            <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
              Basé sur vos ventes actuelles et vos niveaux de stocks, voici les recommandations automatiques :
            </p>
            <div className="space-y-4">
              {aiTips.length > 0 ? aiTips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  <p className="text-sm">{tip}</p>
                </div>
              )) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/20 rounded w-full"></div>
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-5/6"></div>
                </div>
              )}
            </div>
          </div>
          <button className="relative z-10 mt-8 w-full py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
            Générer Rapport Complet
          </button>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
        </div>
      </div>
    </div>
  );
};