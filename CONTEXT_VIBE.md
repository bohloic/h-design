# CONTEXT_VIBE

## Architecture du Projet
Le projet est une application web front-end développée avec **React**, **Vite**, et **TypeScript**. Il utilise **Tailwind CSS** pour le stylisme. L'architecture est organisée autour de :
- `src/components/` : Composants réutilisables (UI, chatbot, produit, etc.).
- `pages/` : Vues de l'application (Accueil, Boutique, Checkout, Dashboard utilisateur et admin).
- `src/store/` : Gestion de l'état global avec Zustand (paniers, notifications, etc.).
- `src/utils/` : Utilitaires et contextes (AuthContext, configuration API).
- Le backend (qui semble tourner localement sur `c:\xampp\htdocs\backend-boutique-de noel`) fournit les API RESTful.

## Fichiers Modifiés/Explorés (Dernières Minutes)
Durant les dernières minutes, j'ai analysé en profondeur la structure existante pour localiser les sources des bugs signalés. Les fichiers principaux inspectés sont :
- `src/components/chatbot/ChatWidget.jsx`
- `pages/Home.tsx`
- `services/geminiService.ts`
- `pages/dashboard/OrderDetails.tsx`
- `pages/Checkout.tsx`
- `pages/Shop.tsx`
- `src/components/product/ProductCard.tsx`
- `pages/products/ProductDetails.tsx`
- `App.tsx`
- `src/utils/context/AuthContext.tsx`
- `pages/products/ProductCustomizer.tsx`

Aucun nouveau fichier n'a encore été créé.

## Prochaine Tâche Technique
La prochaine étape consiste à implémenter les 7 correctifs demandés :
1. **Chatbot (ChatWidget & Home)** : Améliorer l'ergonomie (rester accessible sans scroller tout en haut) et supprimer les références persistantes à "Noël" ou aux messages par défaut inadaptés.
2. **Déconnexion (AuthContext & App)** : Assurer un rafraîchissement complet ou un nettoyage rigoureux de l'état (panier, infos utilisateur) lors de la déconnexion pour empêcher la persistance des données.
3. **Détails de commande (OrderDetails)** :
   - Supprimer le bouton "Annuler ma commande".
   - Corriger l'affichage du prix de la livraison (calculer le `shipping_fee` côté frontend si le backend ne le renvoie pas correctement ou vérifier son intégration).
4. **Personnalisation (ProductCustomizer & Shop/ProductDetails)** : 
   - Afficher le t-shirt sans motif par défaut dans la page de personnalisation, sauf si on y accède via le bouton "Personnaliser" d'un produit spécifique.
   - Sélection automatique de la variante lorsqu'on clique sur "Voir" depuis la boutique.
5. **Checkout** : Désactiver le champ email (`disabled`) pour empêcher sa modification lors du processus de paiement.
