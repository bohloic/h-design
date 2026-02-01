import { authFetch } from '../../src/utils/apiClient';
import { formatCurrency } from "@/constants"
import { DecodedToken } from "@/types";
import { jwtDecode } from "jwt-decode";
import { Gift, Package, Star, Calendar, CreditCard, ChevronRight } from "lucide-react"
import React, { useEffect, useState } from 'react';

export const Commande = () => {
    const token = localStorage.getItem('token')
      
    const[user, setUser] = useState({})
    const[order, setOrder] = useState([])
    const[loading, setLoading] = useState(true)

    useEffect(() => {
        if(token){
            const getUser = async () => {
                try {
                    setLoading(true)
                    const decodedToken = jwtDecode<DecodedToken>(token);
                    const userId = decodedToken.userId
                    
                    const [responseUser, responseOrder] = await Promise.all([
                        authFetch(`/api/users/${userId}`),
                        authFetch(`/api/orders/my-orders/${userId}`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ])

                    const users = await responseUser.json()
                    const orders = await responseOrder.json()
                    
                    setUser(users)
                    setOrder(orders)
                } catch(error){
                    console.error(error)
                } finally {
                    setLoading(false)
                }
            } 
            getUser()
        }
    },[token])


    let total = 0
    order?.forEach((o: any) => {
        total += Number.parseInt(o.total_amount) || 0
    })
    
    if (loading) {
        return <div className="p-8 text-center text-slate-400">Chargement de vos commandes...</div>
    }

    return(
        <div>
            {/* Main Content */}
            <main className="flex-1 space-y-6 lg:space-y-8">
                
                {/* --- STATISTIQUES (Cards) --- */}
                {/* Mobile: 1 col / Desktop: 3 cols */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-red-200 relative overflow-hidden">
                        <Package className="w-8 h-8 mb-4 opacity-50 absolute right-4 top-4" />
                        <p className="text-white/70 text-xs md:text-sm font-bold uppercase tracking-widest">Total Dépensé</p>
                        <h3 className="text-2xl md:text-3xl font-black mt-1">{formatCurrency(total)}</h3>
                    </div>
                    
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest">Fidélité</p>
                            <Star className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">Argent</h3>
                    </div>
                    
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest">Offres</p>
                            <Gift className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">03</h3>
                    </div>
                </div>

                {/* --- HISTORIQUE --- */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100">
                        <h3 className="text-xl md:text-2xl font-bold">Historique des commandes</h3>
                    </div>
                    
                    {order.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Aucune commande pour le moment.</div>
                    ) : (
                        <>
                            {/* --- TABLEAU DESKTOP (Caché sur mobile) --- */}
                            <div className="hidden md:block overflow-x-auto">
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
                                    <tbody className="divide-y divide-slate-100">
                                        {order?.map((ord: any) => (
                                            <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-6 font-bold text-slate-800">#{ord.id}</td>
                                                <td className="px-8 py-6 text-slate-500">{new Date(ord.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-6 font-black text-red-600">{formatCurrency(ord.total_amount)}</td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        ord.status === 'Payé' ? 'bg-green-100 text-green-700' : 
                                                        ord.status === 'En attente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {ord.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button className="text-red-600 font-bold hover:underline text-sm">Détails</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- LISTE MOBILE (Cartes empilées) --- */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {order?.map((ord: any) => (
                                    <div key={ord.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                                        
                                        {/* En-tête de la carte : ID et Date */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase">Commande</span>
                                                <p className="font-bold text-slate-800">#{ord.id}</p>
                                            </div>
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <Calendar size={14} className="mr-1" />
                                                {new Date(ord.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Corps : Montant et Statut */}
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={16} className="text-slate-400" />
                                                <span className="font-black text-red-600">{formatCurrency(ord.total_amount)}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                ord.status === 'Payé' ? 'bg-green-100 text-green-700' : 
                                                ord.status === 'En attente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {ord.status}
                                            </span>
                                        </div>

                                        {/* Pied : Bouton Détails */}
                                        <button className="w-full flex items-center justify-between text-sm font-bold text-slate-600 hover:text-red-600 pt-1">
                                            <span>Voir les détails</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}