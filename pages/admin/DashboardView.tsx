import React, { useState, useEffect } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { analyzeSales } from '../../services/geminiService';
import { StatCard } from '@/src/components/admin/StatCard';
import { CheckCircle2, ShoppingBag, TrendingUp, Users, Sparkles, Loader2, Download } from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
// 🪄 IMPORT DU THEME
import { useTheme } from '@/src/utils/context/ThemeContext'; // Ajuste le chemin si besoin

export const DashboardView = () => {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // 🪄 RÉCUPÉRATION DE LA COULEUR DU THEME POUR RECHARTS
  const { themeColor } = useTheme();

  // Stats de la période actuelle
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageCart: 0
  });
  
  // Tendances calculées (+X% ou -Y%)
  const [trends, setTrends] = useState({
    sales: "0%",
    orders: "0%",
    customers: "0%",
    averageCart: "0%"
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState('30'); 

  // Fonction utilitaire pour calculer le pourcentage
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const percent = ((current - previous) / previous) * 100;
    return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          authFetch('/api/orders'),
          authFetch('/api/users'),
          authFetch('/api/products/get-product')
        ]);

        if (!ordersRes.ok || !usersRes.ok) throw new Error("Erreur serveur");

        const allOrders = await ordersRes.json();
        const allUsers = await usersRes.json();
        const products = await productsRes.json();

        // 📅 GESTION DES DATES
        const now = new Date();
        const days = timeframe === 'all' ? 9999 : parseInt(timeframe);
        
        const currentPeriodStart = new Date();
        currentPeriodStart.setDate(now.getDate() - days);
        
        const previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(currentPeriodStart.getDate() - days);

        const realCustomers = allUsers.filter((u: any) => ['client', 'customer'].includes(u.role));
        const validOrders = allOrders.filter((o: any) => o.status !== 'cancelled');

        // Séparation Période Actuelle vs Période Précédente
        const currentOrders = validOrders.filter((o: any) => new Date(o.created_at) >= currentPeriodStart);
        const previousOrders = timeframe === 'all' 
            ? [] 
            : validOrders.filter((o: any) => {
                const d = new Date(o.created_at);
                return d >= previousPeriodStart && d < currentPeriodStart;
              });

        // 📊 CALCULS PÉRIODE ACTUELLE
        const currentCA = currentOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);
        const currentAvg = currentOrders.length > 0 ? (currentCA / currentOrders.length) : 0;
        
        const currentNewCustomers = realCustomers.filter((u: any) => new Date(u.created_at) >= currentPeriodStart).length;

        setStats({
          totalSales: currentCA,
          totalOrders: currentOrders.length,
          totalCustomers: currentNewCustomers, 
          averageCart: currentAvg
        });

        // 📉 CALCULS PÉRIODE PRÉCÉDENTE
        if (timeframe !== 'all') {
            const prevCA = previousOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);
            const prevAvg = previousOrders.length > 0 ? (prevCA / previousOrders.length) : 0;
            const prevNewCustomers = realCustomers.filter((u: any) => {
                const d = new Date(u.created_at);
                return d >= previousPeriodStart && d < currentPeriodStart;
            }).length;

            setTrends({
                sales: calculateTrend(currentCA, prevCA),
                orders: calculateTrend(currentOrders.length, previousOrders.length),
                customers: calculateTrend(currentNewCustomers, prevNewCustomers),
                averageCart: calculateTrend(currentAvg, prevAvg)
            });
        } else {
            setTrends({ sales: "", orders: "", customers: "", averageCart: "" }); 
        }

        // 📈 CALCUL DU GRAPHIQUE
        const chartDaysLimit = Math.min(days, 90); 
        const newChartData = [];
        
        for (let i = chartDaysLimit - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            const axisDate = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const fullDate = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            
            const dayOrders = currentOrders.filter((o: any) => {
                const orderDate = new Date(o.created_at);
                return orderDate.getDate() === d.getDate() && orderDate.getMonth() === d.getMonth() && orderDate.getFullYear() === d.getFullYear();
            });

            const daySales = dayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);

            newChartData.push({
                name: axisDate,
                fullDate: fullDate,
                sales: daySales,
                orders: dayOrders.length
            });
        }
        setChartData(newChartData);

        // 🤖 GÉNÉRATION DES INSIGHTS IA
        try {
            const tips = await analyzeSales(currentOrders, products);
            setAiTips(tips);
        } catch (e) {
            setAiTips([
                "Développez de nouvelles collections pour la saison prochaine.", 
                "Vos t-shirts unisexe performent très bien.", 
                "Pensez à relancer les clients avec des paniers abandonnés."
            ]);
        }

      } catch (error) {
        console.error("Erreur Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]); 

  // 🖨️ GESTION DU BOUTON D'EXPORT BACKEND
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const response = await authFetch(`/api/reports/export?timeframe=${timeframe}`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error("Échec de la génération du rapport");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `rapport_boutique_${timeframe === 'all' ? 'global' : timeframe + 'j'}.pdf`; 
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Erreur d'export:", error);
      alert("Une erreur est survenue lors de la génération du rapport.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
      return (
          <div className="flex h-[80vh] items-center justify-center text-slate-400 flex-col gap-4">
              {/* 🪄 Loader dynamique */}
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
              <p className="font-bold">Analyse de vos données en cours...</p>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-[100vw] overflow-x-hidden">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
            label="Chiffre d'Affaires" 
            value={`${stats.totalSales.toLocaleString('fr-FR')} FCFA`} 
            trend={trends.sales} 
            icon={ShoppingBag} 
            color="red" 
            periodText={timeframe === 'all' ? '' : 'vs période préc.'}
        />
        <StatCard 
            label="Commandes Valides" 
            value={stats.totalOrders.toString()} 
            trend={trends.orders} 
            icon={CheckCircle2} 
            color="emerald" 
            periodText={timeframe === 'all' ? '' : 'vs période préc.'}
        />
        <StatCard 
            label="Nouveaux Clients" 
            value={stats.totalCustomers.toString()} 
            trend={trends.customers} 
            icon={Users} 
            color="sky" 
            periodText={timeframe === 'all' ? '' : 'vs période préc.'}
        />
        <StatCard 
            label="Panier Moyen" 
            value={`${Math.round(stats.averageCart).toLocaleString('fr-FR')} FCFA`} 
            trend={trends.averageCart} 
            icon={TrendingUp} 
            color="amber" 
            periodText={timeframe === 'all' ? '' : 'vs période préc.'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Performance des Ventes</h3>
            
            <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-50 border-none text-sm font-medium rounded-lg px-3 py-2 outline-none w-full sm:w-auto cursor-pointer focus:ring-2 transition-all"
                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
            >
              <option value="7">7 derniers jours</option>
              <option value="30">Ce mois-ci (30j)</option>
              <option value="90">3 derniers mois</option>
              <option value="365">Cette année</option>
              <option value="all">Tout le temps</option>
            </select>
          </div>
          
          <div className="h-56 sm:h-80 w-full min-h-[250px]">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    {/* 🪄 Injecte themeColor directement dans le SVG */}
                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${value}`} />
                
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', color: themeColor, fontWeight: 'bold' }} // 🪄 Tooltip coloré
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Ventes']}
                />
                {/* 🪄 Courbe colorée */}
                <Area type="monotone" dataKey="sales" stroke={themeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div 
                  className="p-2 rounded-lg backdrop-blur-sm"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', color: 'var(--theme-primary)' }}
              >
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-lg">Insights IA Gemini</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Analyse automatique de vos performances réelles et recommandations.
            </p>
            <div className="space-y-3">
              {aiTips.length > 0 ? aiTips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                  <span 
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                      {idx + 1}
                  </span>
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
          
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            style={{ backgroundColor: 'var(--theme-primary)' }}
            className="relative z-10 mt-8 w-full py-3 flex items-center justify-center gap-2 text-white font-bold rounded-xl opacity-90 hover:opacity-100 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {isExporting ? 'Génération en cours...' : 'Générer un rapport complet'}
          </button>
          
          {/* Effets de flou d'arrière-plan colorés selon le thème */}
          <div 
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none"
              style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
          ></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[40px] -ml-16 -mb-16 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};