
import React from 'react';
import { User, Package, Heart, Star, Settings, CreditCard, LogOut, ChevronRight, Gift } from 'lucide-react';
import { formatCurrency } from '../constants';
import { Order } from '../types';
import LogoutButton from '../src/components/logoutButton';


const MOCK_USER = {
  name: "Jean Kouassi",
  email: "jean.kouassi@exemple.com",
  points: 1250,
  joinedDate: "Novembre 2023",
  orders: [
    {
      id: "CMD-2024-001",
      date: "12 Déc. 2024",
      total: 45000,
      status: "Payé",
      items: 3
    },
    {
      id: "CMD-2024-002",
      date: "05 Déc. 2024",
      total: 12000,
      status: "Livré",
      items: 1
    }
  ]
};

const Dashboard: React.FC = () => {
  // console.log(localStorage)
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-72 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 border-4 border-white shadow-lg">
              <User size={48} />
            </div>
            <h2 className="text-xl font-bold">{MOCK_USER.name}</h2>
            <p className="text-slate-500 text-sm mb-4">{MOCK_USER.email}</p>
            <div className="w-full bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Points Cadeaux</p>
                <p className="text-lg font-black text-red-600">{MOCK_USER.points} pts</p>
              </div>
              <Gift className="text-amber-400 w-8 h-8" />
            </div>
          </div>

          <nav className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 space-y-1">
            <button className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl font-bold transition-all">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5" />
                <span>Mes Commandes</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5" />
                <span>Ma Liste d'Envies</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5" />
                <span>Moyens de Paiement</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* <button  className="w-full flex items-center justify-between p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5"  />
                <span>Déconnexion</span>
              </div>
            </button> */}
            <LogoutButton ></LogoutButton>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-3xl text-white shadow-xl shadow-red-200">
              <Package className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Total Dépensé</p>
              <h3 className="text-3xl font-black mt-2">{formatCurrency(57000)}</h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <Star className="w-8 h-8 mb-4 text-amber-400" />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Niveau Fidélité</p>
              <h3 className="text-3xl font-black mt-2 text-slate-800">Argent</h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <Gift className="w-8 h-8 mb-4 text-green-600" />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Offres en cours</p>
              <h3 className="text-3xl font-black mt-2 text-slate-800">03</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b">
              <h3 className="text-2xl font-bold">Historique des commandes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">N° Commande</th>
                    <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Montant</th>
                    <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                    <th className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MOCK_USER.orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-800">{order.id}</td>
                      <td className="px-8 py-6 text-slate-500">{order.date}</td>
                      <td className="px-8 py-6 font-black text-red-600">{formatCurrency(order.total)}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          order.status === 'Payé' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button className="text-red-600 font-bold hover:underline">Détails</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
