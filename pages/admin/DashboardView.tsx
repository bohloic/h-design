import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../../src/utils/apiClient';
import { analyzeSales } from '../../services/geminiService';
import { useAutoRefresh } from '../../src/utils/hooks/useAutoRefresh';
import { StatCard } from '@/components/admin/StatCard';
import { 
  CheckCircle2, ShoppingBag, TrendingUp, Users, Sparkles, Loader2, Download,
  Plus, ScanBarcode, ArrowRight, Package, ShieldCheck, Zap
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
import { useTheme } from '@/utils/context/ThemeContext';
import { useToast } from '@/utils/context/ToastContext';
import LoadingSpinner from '../../src/components/tools/LoadingSpinner';
import { ADMIN_BASE_PATH, formatCurrency } from '@/constants';
import { useNavigate } from 'react-router-dom';

export const DashboardView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();
  const { themeColor } = useTheme();

  // Stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageCart: 0
  });
  
  const [trends, setTrends] = useState({
    sales: "+16.8%",
    orders: "+12.5%",
    customers: "+10.3%",
    averageCart: "+2.4%"
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState('30'); 
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const percent = ((current - previous) / previous) * 100;
    return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  const fetchDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
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

        // Recent orders slice
        setRecentOrders(allOrders.slice(0, 5));
        setTopProducts(products.slice(0, 5));

        const currentOrders = validOrders.filter((o: any) => new Date(o.created_at) >= currentPeriodStart);
        const previousOrders = timeframe === 'all' 
            ? [] 
            : validOrders.filter((o: any) => {
                const d = new Date(o.created_at);
                return d >= previousPeriodStart && d < currentPeriodStart;
              });

        const currentCA = currentOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);
        const currentAvg = currentOrders.length > 0 ? (currentCA / currentOrders.length) : 0;
        const currentNewCustomers = realCustomers.filter((u: any) => new Date(u.created_at) >= currentPeriodStart).length;

        setStats({
          totalSales: currentCA,
          totalOrders: currentOrders.length,
          totalCustomers: currentNewCustomers, 
          averageCart: currentAvg
        });

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
            setTrends({ sales: "+16.8%", orders: "+12.5%", customers: "+10.3%", averageCart: "+2.4%" }); 
        }

        // Graphique
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

        // Insights IA
        try {
            const tips = await analyzeSales(currentOrders, products);
            setAiTips(tips);
        } catch (e) {
            setAiTips([
                "Développez de nouvelles collections pour la saison prochaine.", 
                "Vos t-shirts unisexe personnalisés performent très bien.", 
                "Pensez à relancer les clients avec des points VIP inutilisés."
            ]);
        }

      } catch (error) {
        console.error("Erreur Dashboard:", error);
      } finally {
        if (showLoader) setLoading(false);
      }
  }, [timeframe]);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  useAutoRefresh(() => fetchDashboardData(false), 10000);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const response = await authFetch(`/api/reports/export?timeframe=${timeframe}`, { method: 'GET' });
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
      showToast("Une erreur est survenue lors de la génération du rapport.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
      return (
          <div className="flex h-[80vh] items-center justify-center text-slate-400 flex-col gap-4">
              <LoadingSpinner size={80} />
              <p className="font-bold text-sm">Analyse du Centre de Ventes H-Designer en cours...</p>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-[100vw] overflow-x-hidden">
      
      {/* 🚀 BANNIÈRE "SALES BOOST" INSPIRED BY SHOPNEST MODEL */}
      <div 
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)`
        }}
        className="p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 inline-flex items-center gap-1">
            <Zap size={12} className="text-amber-300" /> Centre de Ventes & Marketing
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Votre Boutique, Votre Succès</h1>
          <p className="text-white/80 text-sm">
            Pilotez vos ventes, validez les designs personnalisés de vos clients et gérez vos stocks en temps réel.
          </p>
        </div>

        {/* RACCOURCIS D'ACTIONS RAPIDES */}
        <div className="relative z-10 flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => navigate(`${ADMIN_BASE_PATH}/products`)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Plus size={16} className="text-theme-primary" /> Nouveau Produit
          </button>
          <button
            onClick={() => navigate(`${ADMIN_BASE_PATH}/orders`)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 backdrop-blur-md border border-white/20 transition-all active:scale-95"
          >
            <ShoppingBag size={16} /> Gérer Commandes
          </button>
          <button
            onClick={() => navigate(`${ADMIN_BASE_PATH}/vip-scanner`)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <ScanBarcode size={16} /> Scanner VIP
          </button>
        </div>

        {/* Décoration en fond */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 📊 4 METRIC STATCARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
            label="Chiffre d'Affaires" 
            value={formatCurrency(stats.totalSales)} 
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
            value={formatCurrency(Math.round(stats.averageCart))} 
            trend={trends.averageCart} 
            icon={TrendingUp} 
            color="amber" 
            periodText={timeframe === 'all' ? '' : 'vs période préc.'}
        />
      </div>

      {/* 📈 GRAPHIQUE PERFORMANCE & INSIGHTS IA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Aperçu Global des Ventes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Évolution des revenus enregistrés sur la boutique</p>
            </div>
            
            <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                aria-label="Sélectionner la période d'analyse"
                className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-xl px-4 py-2 outline-none w-full sm:w-auto cursor-pointer focus:ring-2 focus:ring-slate-300 transition-all"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">Ce mois-ci (30j)</option>
              <option value="90">3 derniers mois</option>
              <option value="365">Cette année</option>
              <option value="all">Historique global</option>
            </select>
          </div>
          
          <div className="h-64 sm:h-80 w-full min-h-[250px]">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', color: themeColor, fontWeight: 'bold' }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Ventes']}
                />
                <Area type="monotone" dataKey="sales" stroke={themeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD INSIGHTS IA & RAPPORT */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-theme-primary/20 text-theme-primary">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-lg">Recommandations IA Gemini</h3>
            </div>
            <p className="text-slate-300 text-xs mb-6 leading-relaxed">
              Analyse prédictive des tendances et suggestions d'optimisation du catalogue.
            </p>
            <div className="space-y-3">
              {aiTips.length > 0 ? aiTips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 bg-white/5 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-theme-primary shadow-md">
                      {idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">{tip}</p>
                </div>
              )) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="relative z-10 mt-8 w-full py-3.5 flex items-center justify-center gap-2 text-white font-bold text-xs rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 theme-bg-primary bg-theme-primary"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Génération du PDF...' : 'Télécharger le rapport analytique (PDF)'}
          </button>
        </div>
      </div>

      {/* 📦 TABLEAU DES COMMANDES RÉCENTES & MEILLEURES VENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Commandes récentes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <ShoppingBag size={18} className="text-theme-primary" /> Commandes Récentes
            </h3>
            <button 
              onClick={() => navigate(`${ADMIN_BASE_PATH}/orders`)}
              className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Commande</th>
                  <th className="py-3 px-2">Client</th>
                  <th className="py-3 px-2">Montant</th>
                  <th className="py-3 px-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">Aucune commande récente</td>
                  </tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr 
                      key={order.id} 
                      onClick={() => navigate(`${ADMIN_BASE_PATH}/orders/${order.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-2 font-bold text-slate-800">#{order.slug || `HD-${String(order.id).padStart(5, '0')}`}</td>
                      <td className="py-3 px-2 text-slate-600 text-xs truncate max-w-[120px]">{order.customer_name || order.customer_email || 'Client'}</td>
                      <td className="py-3 px-2 font-black text-slate-900 text-xs">{formatCurrency(parseFloat(order.total_amount))}</td>
                      <td className="py-3 px-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Package size={18} className="text-theme-primary" /> Produits Phares
            </h3>
            <div className="space-y-3">
              {topProducts.map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">{p.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 flex-shrink-0 ml-2">
                    {formatCurrency(parseFloat(p.price))}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate(`${ADMIN_BASE_PATH}/products`)}
            className="w-full mt-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Accéder à l'inventaire complet
          </button>
        </div>
      </div>
    </div>
  );
};