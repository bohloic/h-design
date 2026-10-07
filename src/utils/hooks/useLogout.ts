import { useAuth } from '../context/AuthContext';

export const useLogout = () => {
  const { logout } = useAuth();
  // Retourne simplement la fonction logout du contexte Auth qui gère le nettoyage complet, la synchronisation multi‑onglets et le rechargement de la page.
  return logout;
};
