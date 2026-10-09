import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ADMIN_BASE_PATH } from "../constants";

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-container">
      {/* Sidebar Gauche */}
      <aside className="admin-sidebar">
        <h3>Admin Panel</h3>
        <nav>
          <Link to={ADMIN_BASE_PATH}>Vue d'ensemble</Link>
          <Link to={`${ADMIN_BASE_PATH}/produits`}>Produits</Link>
          <Link to={`${ADMIN_BASE_PATH}/commandes`}>Commandes</Link>
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
