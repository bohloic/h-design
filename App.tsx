import React, { useState, useEffect } from 'react';
import { authFetch } from '@/src/utils/apiClient.ts';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartItem, DecodedToken, Product } from './types';
import { jwtDecode } from 'jwt-decode';

// Components
import Navbar from './src/components/elements/Navbar.tsx';
import CartDrawer from './src/components/cart/CartDrawer.tsx';
import Snowfall from './src/components/tools/Snowfall.tsx';
import Footer from './src/components/elements/Footer.tsx';
import ScrollToTop from './src/components/tools/ScrollToTop.tsx';
import ChatWidget from './src/components/chatbot/ChatWidget.jsx';

// Routes Guards
import AdminRoute from './src/components/routes/AdminRoute.jsx';
import PrivateRoute from './src/components/routes/PrivateRoute.tsx';
import GuestRoute from './src/components/routes/GuestRoute.tsx';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import Dashboard from './pages/dashboard/Dashboard.tsx';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import OrderConfirmed from './pages/OrderConfirmed.tsx';
import ProductDetails from './pages/products/ProductDetails.tsx';
import ProductCustomizer from './pages/products/ProductCustomizer.tsx';

// Admin Pages & Layouts
import { AppLayout } from './src/layouts/AppLayout';
import { DashboardView } from './pages/admin/DashboardView.tsx';
import { ProductView } from './pages/admin/ProductView.tsx';
import { OrderView } from './pages/admin/OrderView.tsx';
import { CustomerView } from './pages/admin/CustomerView.tsx';
import { CollectionView } from './pages/admin/CollectionView.tsx';
import { CategoryView } from './pages/admin/CategoryView.tsx';
import { DeliveryView } from './pages/admin/DeliveryView.tsx';
import { OrderDetailView } from './pages/admin/OrderDetailView.tsx';
import PaymentCallback from './pages/PaymentCallback.tsx';
import { AdminVIPScanner } from './pages/admin/AdminVIPScanner.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import { ThemeProvider } from './src/utils/context/ThemeContext.tsx';
import { AdminValidationDesigns } from './src/components/admin/AdminValidationDesigns.tsx';


const App: React.FC = () => {
  
  // --- GESTION DU PANIER ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Erreur lecture panier", error);
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // --- CORRECTION GESTION USER DATA ---
  const [data, setData] = useState<any>(() => {
    try {
      const saveData = localStorage.getItem('data');
      return saveData ? JSON.parse(saveData) : {};
    } catch (error) {
      console.error("Erreur lecture user data", error);
      return {};
    }
  });

  // 👇 LE BLOC MAGIQUE POUR VIDER LE PANIER APRÈS PAYSTACK 👇
  useEffect(() => {
    const checkCart = () => {
      // On vérifie si le localStorage contient encore le panier
      const savedCart = localStorage.getItem('cart');
      
      if (savedCart) {
        try {
            setCart(JSON.parse(savedCart));
        } catch (e) {
            setCart([]);
        }
      } else {
        // Si le localStorage est vide (ce que fait PaymentCallback), on vide l'état React
        setCart([]);
      }
    };

    // On écoute le signal envoyé par PaymentCallback
    window.addEventListener('cartUpdated', checkCart);
    // On écoute aussi les changements d'onglets
    window.addEventListener('storage', checkCart);

    return () => {
      window.removeEventListener('cartUpdated', checkCart);
      window.removeEventListener('storage', checkCart);
    };
  }, []);
  // 👆 FIN DU BLOC MAGIQUE 👆


  // --- SAUVEGARDE PANIER ---
  useEffect(() => {
    // On ne sauvegarde que si le panier n'est pas vide pour éviter d'écraser le vidage
    // Mais ici on veut synchroniser, donc on laisse le useEffect standard
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // --- AUTHENTIFICATION & USER DATA ---
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      setIsAuthenticated(true);
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        
        if (decodedToken.userId) {
            const fetchUser = async () => {
              try {
                const response = await authFetch(`/api/users/${decodedToken.userId}`);
                if(response.ok) {
                    const userData = await response.json();
                    const { password, ...safeUserData } = userData; 
                    setData(safeUserData);
                    localStorage.setItem('data', JSON.stringify(safeUserData));
                }
              } catch (err) {
                  console.error("Erreur fetch user", err);
              }
            };
            fetchUser();
        }
      } catch (error) {
        console.error("Erreur token invalide", error);
        localStorage.removeItem('token');
        localStorage.removeItem('data');
        setIsAuthenticated(false);
      }
    } else {
        setIsAuthenticated(false);
    }
  }, []);


  // --- LOGIQUE PANIER ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    setIsAuthenticated(false);
    setData({});
    window.location.href = '/'; 
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => String(item.id) === String(product.id));
      
      // On récupère la quantité envoyée par la page produit (ou 1 par défaut)
      const quantityToAdd = product.quantity || 1;

      if (existing) {
        // Si le t-shirt est déjà dans le panier, on ADDITIONNE les quantités
        return prev.map(item => 
          String(item.id) === String(product.id) 
            ? { ...item, quantity: item.quantity + quantityToAdd } 
            : item
        );
      }
      
      // Si c'est un nouveau t-shirt, on l'ajoute avec la BONNE quantité
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
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Snowfall />
          
          <Navbar 
            cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} 
            onOpenCart={() => setIsCartOpen(true)} 
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
          />
          
          <ChatWidget />
          
          <main className="flex-grow">
            <Routes>
              {/* --- Routes Publiques --- */}
              <Route path="/" element={<Home onAddToCart={addToCart} />} />
              <Route path="/boutique" element={<Shop onAddToCart={addToCart} />} />
              <Route path="/boutique/produit/:slug" element={<ProductDetails onAddToCart={addToCart} />} />
              <Route path="/personnaliser/mon-design" element={<ProductCustomizer onAddToCart={addToCart} />} />
              
              {/* --- Routes Invités (Login) --- */}
              <Route element={<GuestRoute />}>
                <Route 
                  path="/login" 
                  element={<Auth onLoginSuccess={() => setIsAuthenticated(true)} />} 
                />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* --- Routes Privées (Clients) --- */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/checkout" element={<Checkout cartItems={cart} onClearCart={clearCart} data={data} />} />
                
                {/* Route de retour Paystack */}
                <Route path="/payment/callback" element={<PaymentCallback />} />
                
                <Route path="/order-confirmed" element={<OrderConfirmed /> } />
              </Route>
              
              {/* --- Routes Admin --- */}
              <Route element={<AdminRoute />}> 
                <Route path="/admin" element={<AppLayout title="Tableau de bord"><DashboardView /></AppLayout>} />
                <Route path="/admin/products" element={<AppLayout title="Inventaire Produits"><ProductView /></AppLayout>} />
                <Route path="/admin/orders" element={<AppLayout title="Gestion des Ventes"><OrderView /></AppLayout>} />
                <Route path="/admin/orders/:id" element={<AppLayout title="Gestion des details de ventes"><OrderDetailView /></AppLayout>} />
                <Route path="/admin/validations" element={<AppLayout title="Gestion des validations"><AdminValidationDesigns /></AppLayout>} />
                <Route path="/admin/customers" element={<AppLayout title="Gestion Clients"><CustomerView /></AppLayout>} />
                <Route path='/admin/vip-scanner' element={<AppLayout title='Gestion des fidélisations'><AdminVIPScanner /></AppLayout>} />
                <Route path="/admin/collections" element={<AppLayout title="Gestion des collections"><CollectionView /></AppLayout>} />
                <Route path="/admin/categories" element={<AppLayout title="Gestion des Catégories"><CategoryView /></AppLayout>} />
                <Route path="/admin/deliveries" element={<AppLayout title="Gestion des livraisons"><DeliveryView /></AppLayout>} />

              </Route> 

              {/* 404 */}
              <Route path="*" element={<NotFound />} /> 
            </Routes>
          </main>

          <Footer />

          <CartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)}
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={() => setIsCartOpen(false)}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;