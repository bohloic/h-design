import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, Search, Store, LogOut, ChevronDown,
  Package, ShoppingBag, Users, ArrowRight, X, Loader2, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "../elements/NotificationDropdown";
import { authFetch } from "../../utils/apiClient";
import { BASE_IMG_URL } from "../images/VoirImage";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SearchResults {
  orders: any[];
  products: any[];
  customers: any[];
}

// ─── Utilitaire debounce ─────────────────────────────────────────────────────
const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ─── Composant SearchBar ─────────────────────────────────────────────────────
const SearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const debouncedQuery = useDebounce(query, 350);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme si clic dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Appel API dès que le debounced query change
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      setErrorStatus(null);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        const res = await authFetch(`/api/admin/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setIsOpen(true);
        } else {
          setResults(null);
          setErrorStatus(res.status);
          setIsOpen(true);
          console.error(`Search failed: HTTP ${res.status}`);
        }
      } catch (e) {
        setResults(null);
        setErrorStatus(500);
        setIsOpen(true);
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [debouncedQuery]);

  const hasResults = results && (
    results.orders.length > 0 || results.products.length > 0 || results.customers.length > 0
  );

  const goTo = (path: string, id: string | number) => {
    setIsOpen(false);
    setQuery('');
    // On ajoute un paramètre highlight pour que la page sache quoi mettre en évidence
    const separator = path.includes('?') ? '&' : '?';
    navigate(`${path}${separator}highlight=${id}`);
  };

  const translateStatus = (s: string) => {
    if (!s) return 'Inconnu';
    const st = String(s).toLowerCase();
    if (st.includes('pending')) return 'En attente';
    if (st.includes('paid_waiting')) return 'Validation Design';
    if (st.includes('paid')) return 'Payé';
    if (st.includes('processing')) return 'En préparation';
    if (st.includes('shipped')) return 'Expédié';
    if (st.includes('delivered')) return 'Livré';
    if (st.includes('cancelled')) return 'Annulé';
    return s;
  };

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      {/* Input */}
      <div className="relative flex items-center">
        {loading
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={16} />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        }
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => (results || errorStatus) && setIsOpen(true)}
          placeholder="Rechercher commandes, produits, clients..."
          className="pl-9 pr-8 py-2 bg-slate-100 border border-transparent rounded-xl text-sm w-64 transition-all outline-none focus:bg-white focus:border-slate-200 focus:shadow-sm focus:w-80"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setIsOpen(false); setErrorStatus(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown résultats */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">

          {errorStatus ? (
            <div className="p-6 text-center text-red-500 text-sm flex flex-col items-center gap-2">
              <AlertCircle size={24} className="opacity-50" />
              <p className="font-bold">
                {errorStatus === 404 
                  ? "Serveur non joignable (404). Avez-vous redémarré le backend ?" 
                  : `Erreur de recherche (Statut: ${errorStatus})`}
              </p>
              <p className="text-xs text-slate-400">Vérifiez la console du backend.</p>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              Aucun résultat trouvé pour <strong>«{query}»</strong>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">

              {/* ── Commandes ── */}
              {results!.orders.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <ShoppingBag size={13} style={{ color: 'var(--theme-primary)' }} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commandes</span>
                  </div>
                  {results!.orders.map((order: any) => (
                    <button
                      key={order.id}
                      onClick={() => goTo(`/admin/orders/${order.id}`, order.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">#{order.slug || `HD-${String(order.id).padStart(5, '0')}`}</p>
                        <p className="text-xs text-slate-400">{translateStatus(order.status)} · {parseFloat(order.total_amount).toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* ── Produits ── */}
              {results!.products.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <Package size={13} style={{ color: 'var(--theme-primary)' }} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produits</span>
                  </div>
                  {results!.products.map((product: any) => (
                    <button
                      key={product.id}
                      onClick={() => goTo('/admin/products', product.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {product.image_url && (
                          <img src={BASE_IMG_URL + product.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-xs text-slate-400">{parseFloat(product.price).toLocaleString('fr-FR')} FCFA · Stock: {product.stock_quantity}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* ── Clients ── */}
              {results!.customers.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <Users size={13} style={{ color: 'var(--theme-primary)' }} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clients</span>
                  </div>
                  {results!.customers.map((customer: any) => (
                    <button
                      key={customer.id}
                      onClick={() => goTo('/admin/customers', customer.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                      >
                        {customer.prenom?.[0]?.toUpperCase()}{customer.nom?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{customer.prenom} {customer.nom}</p>
                        <p className="text-xs text-slate-400 truncate">{customer.email}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Header Principal ─────────────────────────────────────────────────────────
export const Header = ({ title }: { title: string }) => {
// ... (reste du code identique)
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminData, setAdminData] = useState<any>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const d = localStorage.getItem('data');
      if (d) setAdminData(JSON.parse(d));
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    window.location.href = '/login';
  };

  const initials = adminData?.prenom
    ? adminData.prenom[0].toUpperCase() + (adminData?.nom?.[0]?.toUpperCase() || '')
    : 'A';

  const fullName = adminData?.prenom
    ? `${adminData.prenom} ${adminData.nom || ''}`.trim()
    : 'Administrateur';

  return (
    <header className="h-16 bg-white sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between border-b border-slate-100 shadow-sm gap-4">
      
      {/* Titre */}
      <h2 className="text-lg font-bold text-slate-800 truncate flex-shrink-0">{title}</h2>

      <div className="flex items-center gap-2 md:gap-3 ml-auto">

        {/* 🔍 Barre de recherche globale */}
        <SearchBar />

        {/* Lien vers la boutique */}
        <button
          onClick={() => navigate('/')}
          className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
        >
          <Store size={15} style={{ color: 'var(--theme-primary)' }} />
          <span>Boutique</span>
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(v => !v)}
            className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{fullName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Super Admin</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 hidden md:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800 truncate">{fullName}</p>
                <p className="text-xs text-slate-400 truncate">{adminData?.email || ''}</p>
              </div>
              <button
                onClick={() => { navigate('/'); setIsProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
              >
                <Store size={15} style={{ color: 'var(--theme-primary)' }} />
                Voir la boutique
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};