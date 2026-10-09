import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartItem } from './types';

// Components
import Navbar from '@/components/elements/Navbar';
import MobileBottomNav from '@/components/elements/MobileBottomNav';
import CartDrawer from '@/components/cart/CartDrawer';
import Footer from '@/components/elements/Footer';
import ScrollToTop from '@/components/tools/ScrollToTop';
import PageTransition from '@/components/tools/PageTransition';
import ChatWidget from '@/components/chatbot/ChatWidget';
import { BackToTop } from '@/components/elements/BackToTop';
import WelcomeTour from '@/components/tools/WelcomeTour';

// Styles
import '@/styles/GlobalUX.css';

// Routes Guards
import AdminRoute from '@/components/routes/AdminRoute';
import PrivateRoute from '@/components/routes/PrivateRoute';
import GuestRoute from '@/components/routes/GuestRoute';
import { ADMIN_BASE_PATH } from '@/constants';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import Dashboard from './pages/dashboard/Dashboard';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import OrderConfirmed from './pages/OrderConfirmed';
import ProductDetails from './pages/products/ProductDetails';
import ProductCustomizer from './pages/products/ProductCustomizer';
import HelpSupport from './pages/HelpSupport';

// Dashboard nested pages
import { Overview } from './pages/dashboard/Overview';
import { Commande } from './pages/dashboard/Commande';
import { OrderDetails } from './pages/dashboard/OrderDetails';
import { LoyaltyTab } from './pages/dashboard/LoyaltyPage';
import { Wishlist } from './pages/dashboard/Wishlist';
import { Payments } from './pages/dashboard/Payments';
import { Settings } from './pages/dashboard/Settings';
import { Navigate } from 'react-router-dom';

// Admin Pages & Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardView } from './pages/admin/DashboardView';
import { ProductView } from './pages/admin/ProductView';
import { OrderView } from './pages/admin/OrderView';
import { CustomerView } from './pages/admin/CustomerView';
import { CollectionView } from './pages/admin/CollectionView';
import { CategoryView } from './pages/admin/CategoryView';
import { DeliveryView } from './pages/admin/DeliveryView';
import { OrderDetailView } from './pages/admin/OrderDetailView';
import PaymentCallback from './pages/PaymentCallback';
import { AdminVIPScanner } from './pages/admin/AdminVIPScanner';
import ResetPassword from './pages/ResetPassword';
import { ThemeProvider, useTheme } from '@/utils/context/ThemeContext';
import { AuthProvider, useAuth } from '@/utils/context/AuthContext';
import { ToastProvider } from '@/utils/context/ToastContext';
import { AdminValidationDesigns } from '@/components/admin/AdminValidationDesigns';
import WhatsAppButton from '@/components/elements/WhatsAppButton';

// ============================================================
// Hook de détection des zones "App" (Admin & Dashboard)
// ============================================================
const useIsAdminZone = () => {
  const location = useLocation();
  return location.pathname.startsWith(ADMIN_BASE_PATH);
};

const useIsAuthZone = () => {
  const location = useLocation();
  return ['/login', '/reset-password'].includes(location.pathname);
};

const useIsCustomizerZone = () => {
  const location = useLocation();
  return location.pathname.startsWith('/personnaliser');
};

// ============================================================
// Composant Shell : gère la mise en page conditionnelle
// ============================================================
const AppShell: React.FC<{
  cart: CartItem[];
  isCartOpen: boolean;
  onOpenCart: () => void;
  onCloseCart: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
  addToCart: (product: any) => void;
  clearCart: () => void;
}> = ({ cart, isCartOpen, onOpenCart, onCloseCart, onUpdateQuantity, onRemoveFromCart, addToCart, clearCart }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdminZone = useIsAdminZone();
  const isAuthZone = useIsAuthZone();
  const isCustomizerZone = useIsCustomizerZone();
  const { activeCollection } = useTheme();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // On cache le layout public UNIQUEMENT en zone Admin ou sur les pages Auth
  const hidePublicLayout = isAdminZone || isAuthZone;

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <WelcomeTour />

      {/* 🖼️ BANNIÈRE PUBLIQUE DYNAMIQUE (Cachée UNIQUEMENT en zone Admin) */}
      {!hidePublicLayout && activeCollection?.ui_config?.banner_url && (
        <div className="w-full bg-slate-900 flex items-center justify-center overflow-hidden h-12 sm:h-16 relative z-50">
          <img 
            src={activeCollection.ui_config.banner_url} 
            alt={`Thème ${activeCollection.name}`} 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
             <span className="text-white font-bold text-sm sm:text-base tracking-widest uppercase">
                {activeCollection.name}
             </span>
          </div>
        </div>
      )}


      {/* 🗺️ Navbar publique (Cachée en Admin) */}
      {!hidePublicLayout && (
        <Navbar
          cartCount={cartCount}
          onOpenCart={onOpenCart}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          user={user}
        />
      )}

      {/* 📱 Barre de navigation mobile fixe (TechNova / Learnova UX) */}
      {!hidePublicLayout && !isCustomizerZone && (
        <MobileBottomNav cartCount={cartCount} onOpenCart={onOpenCart} />
      )}

      {/* 💬 ChatBot & Support (Caché en Admin) */}
      {!hidePublicLayout && (
        <>
           <ChatWidget />
           <WhatsAppButton />
        </>
      )}

      {/* 📄 Contenu principal */}
      <main className="flex-grow">
        <PageTransition>
          <Routes>
            {/* --- Routes Publiques --- */}
            <Route path="/" element={<Home onAddToCart={addToCart} />} />
            <Route path="/boutique" element={<Shop onAddToCart={addToCart} />} />
            <Route path="/boutique/produit/:slug" element={<ProductDetails onAddToCart={addToCart} />} />
            <Route path="/personnaliser/mon-design" element={<ProductCustomizer onAddToCart={addToCart} />} />
            <Route path="/aide-sav" element={<HelpSupport />} />

            {/* --- Routes Invités (Login) --- */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* --- Routes Privées (Clients) --- */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard onAddToCart={addToCart} />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="orders" element={<Commande />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="loyalty" element={<LoyaltyTab />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="payments" element={<Payments />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="/checkout" element={<Checkout cartItems={cart} onClearCart={clearCart} data={user} />} />
              <Route path="/order-confirmed" element={<OrderConfirmed />} />
            </Route>
            <Route path="/payment/callback" element={<PaymentCallback />} />

            {/* 🛡️ SÉCURITÉ ADMIN : /admin est masqué et renvoie 404 pour les robots */}
            <Route path="/admin" element={<NotFound />} />
            <Route path="/admin/*" element={<NotFound />} />

            {/* 🔐 ROUTE SECRET ADMIN OBFUSQUÉE */}
            <Route element={<AdminRoute />}>
              <Route path={ADMIN_BASE_PATH} element={<AppLayout title="Tableau de bord"><DashboardView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/products`} element={<AppLayout title="Inventaire Produits"><ProductView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/orders`} element={<AppLayout title="Gestion des Ventes"><OrderView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/orders/:id`} element={<AppLayout title="Détails de la Commande"><OrderDetailView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/validations`} element={<AppLayout title="Validation des Designs"><AdminValidationDesigns /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/customers`} element={<AppLayout title="Gestion Clients"><CustomerView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/vip-scanner`} element={<AppLayout title="Fidélité & Scan VIP"><AdminVIPScanner /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/collections`} element={<AppLayout title="Thèmes & Collections"><CollectionView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/categories`} element={<AppLayout title="Catégories"><CategoryView /></AppLayout>} />
              <Route path={`${ADMIN_BASE_PATH}/deliveries`} element={<AppLayout title="Livraisons"><DeliveryView /></AppLayout>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>

      {/* 🔝 Bouton Retour en haut */}
      <BackToTop />

      {/* 🦶 Footer (Caché en Admin et Personnalisation) */}
      {!hidePublicLayout && !isCustomizerZone && <Footer />}

      {/* 🛒 Tiroir Panier — toujours disponible */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={onCloseCart}
        items={cart}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemoveFromCart}
        onCheckout={onCloseCart}
      />
    </div>
  );
};

// ============================================================
// App Root
// ============================================================
const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch { return []; }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  // ✅ FIX #7 : isAuthenticated et data supprimés ici — gérés par AuthProvider/useAuth()

  // Sync panier depuis localStorage (Paystack callback)
  useEffect(() => {
    const checkCart = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)); } catch { setCart([]); }
      } else {
        setCart([]);
      }
    };
    const handleLogoutCleanup = () => {
      setCart([]);
      localStorage.removeItem('cart');
    };

    window.addEventListener('cartUpdated', checkCart);
    window.addEventListener('storage', checkCart);
    window.addEventListener('userLoggedOut', handleLogoutCleanup);

    return () => {
      window.removeEventListener('cartUpdated', checkCart);
      window.removeEventListener('storage', checkCart);
      window.removeEventListener('userLoggedOut', handleLogoutCleanup);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);



  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => String(item.id) === String(product.id));
      const quantityToAdd = product.quantity || 1;
      if (existing) {
        return prev.map(item =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...prev, { ...product, quantity: quantityToAdd }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item =>
      String(item.id) === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => String(item.id) !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ToastProvider>
              <AppShell
                cart={cart}
                isCartOpen={isCartOpen}
                onOpenCart={() => setIsCartOpen(true)}
                onCloseCart={() => setIsCartOpen(false)}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                addToCart={addToCart}
                clearCart={clearCart}
              />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;