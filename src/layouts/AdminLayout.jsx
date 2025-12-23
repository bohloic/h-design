import { Outlet, Link } from "react-router-dom";
// import "./Admin.css"; // Votre CSS spécifique pour l'admin

const AdminLayout = () => {
  return (
    <div className="admin-container">
      {/* Sidebar Gauche */}
      <aside className="admin-sidebar">
        <h3>Admin Panel</h3>
        <nav>
          <Link to="/admin">Vue d'ensemble</Link>
          <Link to="/admin/produits">Produits</Link>
          <Link to="/admin/commandes">Commandes</Link>
          <Link to="/">Retour au site</Link>
        </nav>
      </aside>

      {/* Contenu Principal */}
      <main className="admin-content">
        <header>Bonjour, Admin</header>
        <div className="content-area">
          {/* C'est ici que les pages enfants s'afficheront */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;