import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartItem, Product } from './types';

// Components
import Navbar from './src/components/Navbar.tsx';
import CartDrawer from './src/components/CartDrawer.tsx';
import Snowfall from './src/components/Snowfall.tsx';
import Footer from './src/components/Footer.tsx';
import ProtectedRoute from './src/components/ProtectedRoute.tsx'; // Assurez-vous que ce fichier existe

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';

// Admin Pages & Layouts
import { AppLayout } from './src/layouts/AppLayout';
import { DashboardView } from './pages/admin/DashboardView';
import { ProductView } from './pages/admin/ProductView';
import { OrderView } from './pages/admin/OrderView';
import { CustomerView } from './pages/admin/CustomerView';
import { CollectionView } from './pages/admin/CollectionView.tsx';
import Error from './src/components/error/index.tsx';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // CORRECTION 1 : Force la valeur en booléen (true/false) avec '!!'
  // Si le token existe, ça vaut true. Sinon, false.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Snowfall />
        <Navbar 
          cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} 
          onOpenCart={() => setIsCartOpen(true)} 
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
        
        <main className="flex-grow">
          <Routes>
            {/* Routes Publiques */}
            <Route path="/" element={<Home onAddToCart={addToCart} />} />
            {/* <Route path="*" element={<Error />} /> */}
            
            <Route path="/boutique" element={<Shop onAddToCart={addToCart} />} />
            
            {/* Login : Redirige vers Dashboard si déjà connecté */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth onLoginSuccess={() => setIsAuthenticated(true)} />
              } 
            />

            {/* Dashboard Client Protégé */}
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
              } 
            />

            {/* --- SECTION ADMIN --- */}
            {/* CORRECTION 2 : On passe isAuthenticated au ProtectedRoute (si votre composant le gère) */}
            {/* Note : Si ProtectedRoute utilise un contexte, pas besoin de passer la prop. Sinon, adaptez ProtectedRoute. */}
            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              
              <Route path="/admin" element={
                <AppLayout title="Tableau de bord">
                  <DashboardView />
                </AppLayout>
              } />
              
              <Route path="/admin/products" element={
                <AppLayout title="Inventaire Produits">
                  <ProductView />
                </AppLayout>
              } />
              
              <Route path="/admin/orders" element={
                <AppLayout title="Gestion des Ventes">
                  <OrderView />
                </AppLayout>
              } />
              
              <Route path="/admin/customers" element={
                <AppLayout title="Gestion Clients">
                  <CustomerView />
                </AppLayout>
              } />

              <Route path="/admin/collections" element={
                <AppLayout title="Gestion des  collections">
                  <CollectionView />
                </AppLayout>
              } />

            </Route> 
            {/* Fin de la section Admin - CORRECTION 3 : J'ai supprimé le </Route> en trop ici */}


            {/* Checkout */}
            <Route path="/checkout" element={<Checkout cartItems={cart} onClearCart={clearCart} />} />

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
          onCheckout={() => {
            setIsCartOpen(false);
            // window.location.hash = '/checkout';
          }}
        />
      </div>
    </Router>
  );
};

export default App;