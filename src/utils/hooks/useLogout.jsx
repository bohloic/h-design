import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
    const navigate = useNavigate();
    // const { clearCart } = useCart();

    const logout = () => {
        // 1. SUPPRIMER TOUTES LES TRACES
        // On supprime le token (le badge d'accès)
        localStorage.removeItem('token');
        // On supprime le rôle (admin/customer)
        localStorage.removeItem('role');
        // On supprime les infos utilisateur (nom, email...)
        localStorage.removeItem('userInfo');
        // (Optionnel) On vide le panier si tu le stockes aussi en local
        localStorage.removeItem('cart'); 
        // Si tu ne fais pas ça, le panier restera affiché jusqu'au rafraîchissement de la page
        // if (clearCart) {
        //     clearCart(); 
        // }

        // 2. REDIRECTION SÉCURISÉE
        // On renvoie tout le monde vers la page de Login
        navigate('/login');
        
        // // 3. (Optionnel mais recommandé) RECHARGEMENT FORCÉ
        // // Cela permet de vider la mémoire (State) de React pour être sûr qu'il ne reste aucune donnée sensible affichée
        // window.location.reload();
    };

    return logout;
};