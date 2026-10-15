# Guide des Tests Manuels - Correctifs et Améliorations Prod

Ce guide fournit la procédure détaillée étape par étape pour vérifier manuellement tous les correctifs et améliorations apportés suite au dernier test en production, tant sur le Panel Admin, le Dashboard Client, l'Atelier de Personnalisation, que sur l'Expérience Mobile / Tablette et le Backend.

---

## Sommaire des Tests

1. [Panel Admin : Inspection HD et Téléchargement des Images IA](#1-panel-admin--inspection-hd-et-téléchargement-des-images-ia)
2. [Panel Admin : Cohérence des Badges Sidebar](#2-panel-admin--cohérence-des-badges-sidebar)
3. [Design Global : Suppression Complète du Mode Sombre](#3-design-global--suppression-complète-du-mode-sombre)
4. [Atelier Personnaliser : Expérience Mobile et Tablette](#4-atelier-personnaliser--expérience-mobile-et-tablette)
5. [Dashboard Client : Option Modifier mon design](#5-dashboard-client--option-modifier-mon-design)
6. [Ergonomie Mobile : Fermeture X Multi-Navigateurs](#6-ergonomie-mobile--fermeture-x-multi-navigateurs)
7. [Authentification par Code et Persistance du ChatBot](#7-authentification-par-code-et-persistance-du-chatbot)
8. [Sécurité Backend et Intégrité OWASP](#8-sécurité-backend-et-intégrité-owasp)

---

## 1. Panel Admin : Inspection HD et Téléchargement des Images IA

### 1.1 Contexte et bug résolu

Auparavant, lors de l'inspection d'un design contenant des images générées par l'IA (format Base64 `data:image/...`), le téléchargement échouait ou ouvrait une page blanche `about:blank#blocked` car le système tentait de préfixer l'URL avec `BASE_IMG_URL` et déclenchait une erreur 404. Le nouveau module `imageDownloader.ts` convertit directement les flux Base64 en Blobs binaires natifs téléchargeables.

### 1.2 Procédure de test pour le téléchargement IA

1. Se connecter au Panel Admin (`/admin_h_designer_sec_2024/validations`).
2. Repérer une commande contenant un visuel personnalisé avec IA.
3. Cliquer sur l'œil d'inspection « Inspection & Test du Design HD ».
4. Dans la fenêtre modale HD :
   - Tester le bouton « Télécharger la Maquette HD (300 DPI) ».
   - Tester le bouton « Télécharger le Visuel Transparent » ou « Télécharger l'élément source » sous chaque composant IA.
5. Ouvrir le fichier téléchargé sur votre ordinateur.

### 1.3 Résultat attendu pour le téléchargement IA

- [ ] Le fichier `.png` est téléchargé instantanément sans ouvrir de page blanche.
- [ ] L'image téléchargée n'est **pas vide** : le visuel généré par l'IA apparaît en haute résolution, avec sa transparence et ses couleurs réelles.
- [ ] Aucune erreur réseau (404) ou `about:blank#blocked` n'apparaît dans la console DevTools.

---

## 2. Panel Admin : Cohérence des Badges Sidebar

### 2.1 Contexte et synchronisation des badges

Le nombre affiché dans les badges de la sidebar (« Validations Design » et « Commandes ») ne correspondait pas au nombre de cartes visibles sur la page en raison d'une divergence entre la requête SQL de comptage et les filtres de statut frontend. De plus, lors de la validation ou du refus d'un design, le badge restait statique sans rafraîchissement.

### 2.2 Procédure de test pour les badges

1. Accéder au Panel Admin.
2. Observer le badge rouge à côté de « Validations Design » dans la barre latérale gauche (ex : affiche `3`).
3. Cliquer sur « Validations Design » et compter le nombre de cartes de commande en attente affichées sur la page.
4. Approuver ou Refuser l'un des designs.
5. Observer immédiatement le badge de la sidebar sans recharger la page (`F5`).
6. Vérifier également le badge « Commandes » par rapport aux commandes actives (hors annulées).

### 2.3 Résultat attendu pour les badges

- [ ] Le nombre indiqué dans le badge correspond **exactement** au nombre de cartes affichées.
- [ ] Dès qu'un design est approuvé ou refusé, l'événement `admin_badges_updated` déclenche la mise à jour immédiate du badge (décrémentation en temps réel).
- [ ] Aucune incohérence de chiffres entre la sidebar et la grille centrale.

---

## 3. Design Global : Suppression Complète du Mode Sombre

### 3.1 Contexte et palette claire

Le mode sombre a été totalement retiré de l'application. La palette de couleurs a été calibrée exclusivement en **Mode Clair Premium** : fond doux `#F8FAFC`, cartes blanches `#FFFFFF`, textes contrastés `#0F172A`, textes secondaires `#475569`, bordures épurées `#E2E8F0` et accents dorés/thématiques dynamiques (`var(--theme-primary)`).

### 3.2 Procédure de test pour le mode clair

1. Ouvrir le site sur la page d'accueil (`/`), la boutique (`/boutique`), le panier, l'atelier (`/personnaliser/mon-design`), et le dashboard client.
2. Vérifier la barre de navigation (Navbar) :
   - L'interrupteur Lune / Soleil a disparu du menu desktop.
   - L'interrupteur a également disparu du menu mobile (drawer burger).
3. Configurer votre système d'exploitation (Windows, macOS, Android, iOS) en « Mode Sombre Forcé ».
4. Recharger le site.

### 3.3 Résultat attendu pour le mode clair

- [ ] L'application reste en **mode clair élégant et lumineux**, insensible au mode sombre du système d'exploitation.
- [ ] Tous les textes sont parfaitement lisibles avec un contraste conforme aux normes WCAG AA.
- [ ] Aucun fond noir ou texte sombre sur fond sombre résiduel.

---

## 4. Atelier Personnaliser : Expérience Mobile et Tablette

### 4.1 Contexte et nouveau dock d'outils

Auparavant, sur smartphone et tablette, la navigation par étapes cachait les outils et l'expérience était banale. L'atelier dispose désormais d'un **Dock Interactif Flottant** donnant un accès instantané en 1 toucher à tous les outils :

- Produit (Sélection du textile et des catégories)
- Couleur (Palette textile et bouton d'activation du t-shirt vierge)
- Texte (Ajout et typographies avec adaptation automatique du contraste)
- Images (Importation de photos et visuels locaux)
- IA Magic (Générateur de slogans et images IA DALL-E)
- Calques (Gestionnaire d'empilement : ordre z-index, sélection, suppression)
- Motif Vierge (Bascule directe pour masquer/afficher le motif d'origine)

### 4.2 Procédure de test pour l'atelier

1. Ouvrir `/personnaliser/mon-design` sur smartphone ou émulateur DevTools (largeur < 1024px).
2. Vérifier la présence du Dock Flottant en bas de l'écran.
3. Test Couleur :
   - Toucher l'icône Couleur. Le tiroir s'ouvre directement sur le sélecteur de couleurs.
   - Choisir une couleur (ex : Noir, Rouge, Vert). Le vêtement change immédiatement de teinte.
   - Toucher la croix `[X]` du tiroir : il se replie vers le bas et le canvas réapparaît.
4. Test Texte :
   - Toucher l'icône Texte. Saisir un texte (ex : « H-Designer Abidjan »), choisir une police et toucher « Ajouter au design ».
   - Le texte apparaît sur le vêtement.
5. Test Calques :
   - Toucher l'icône Calques : la pastille numérique indique le nombre exact d'éléments placés (ex : `1` ou `2`).
   - Le tiroir affiche la liste des calques avec prévisualisation.
   - Tester les flèches Haut / Bas pour changer l'ordre d'empilement et la corbeille pour supprimer un calque.
6. Test Motif :
   - Toucher le bouton rapide Motif sur le dock pour masquer/afficher le motif d'origine sans ouvrir de tiroir.

### 4.3 Résultat attendu pour l'atelier

- [ ] L'expérience est ultra-fluide, interactive et moderne.
- [ ] Chaque outil s'ouvre directement sans passer par des sous-menus complexes.
- [ ] Le canvas reste visible et manipulable.

---

## 5. Dashboard Client : Option Modifier mon design

### 5.1 Contexte et accès complet lors de l'édition

Lorsqu'un administrateur refusait un design avec statut « Action Requise / Refusé », le client cliquait sur « Modifier mon design » dans son suivi de commande, mais l'atelier s'ouvrait avec uniquement le vêtement sans aucun menu ni outil accessible.

### 5.2 Procédure de test pour la modification de design

1. Se connecter en tant que Client (`/login`).
2. Aller dans Mon Compte > Mes Commandes (`/dashboard/orders`).
3. Sélectionner une commande contenant un article refusé (badge rouge « Action Requise »).
4. Cliquer sur le bouton « Modifier mon design » (icône Palette).
5. Observer l'ouverture de l'Atelier de Personnalisation :
   - Un **bandeau orange d'alerte** apparaît en haut : « Mode Édition : Commande #... • Action Requise / Refusé ».
   - Si l'administrateur a laissé un motif de refus (ex : « Image floue »), celui-ci est visible.
   - Tous les outils (Texte, Images, Couleurs, Calques, IA) sont **immédiatement ouverts et opérationnels**.
6. Effectuer une modification (remplacer l'image ou corriger le texte).
7. Cliquer sur « Valider la modification » (bouton vert).

### 5.3 Résultat attendu pour la modification de design

- [ ] L'atelier s'ouvre avec tous les menus actifs dès la première seconde.
- [ ] L'article existant de la commande est mis à jour sans créer de doublon dans le panier.
- [ ] Un message de succès confirme la mise à jour et redirige vers le suivi de commande.

---

## 6. Ergonomie Mobile : Fermeture X Multi-Navigateurs

### 6.1 Contexte et robustesse tactile

Sur certains téléphones réels (notamment Android 6/8 et anciennes versions de navigateurs comme Samsung Internet ou anciens Safari), toucher la croix `[X]` d'une modale ne la fermait pas du premier coup en raison de gestionnaires `onTouchEnd` défaillants et de clics interceptés par les balises `<svg>`. Tous les boutons ont été sécurisés avec `touch-action: manipulation`, `pointer-events: none` sur les icônes et écouteurs clavier `Échap`.

### 6.2 Composants tactiles à tester

1. Panier Flottant :
   - Ouvrir le panier depuis le bouton de navigation.
   - Appuyer une seule fois sur la croix `[X]` en haut à droite.
   - Résultat attendu : le tiroir se ferme instantanément du premier coup.
2. Tiroirs Personnalisateur :
   - Ouvrir le tiroir Produits ou Paramètres du design sur `/personnaliser/mon-design`.
   - Appuyer sur `[X]` ou sur l'arrière-plan semi-transparent.
   - Résultat attendu : le tiroir se rétracte immédiatement vers le bas.
3. ChatBot Flottant (Assistant H-Designer) :
   - Ouvrir le chat via la bulle flottante en bas à droite.
   - Appuyer sur `[X]` dans l'en-tête du chat.
   - Résultat attendu : la fenêtre se replie sans saccade ni blocage du scroll de la page.
4. Filtres de la Boutique (`/boutique`) :
   - Sur mobile, toucher le bouton « Filtres ».
   - Toucher `[X]` en haut à droite du volet.
   - Résultat attendu : le volet se ferme sans nécessiter de double-tap.
5. Tour de Bienvenue et Profil Admin :
   - Tester la fermeture via la croix `[X]` ou la touche `Échap`.
   - Résultat attendu : fermeture immédiate au simple contact.

### 6.3 Résultat attendu multi-navigateurs

- [ ] Testé avec succès sur Chrome Mobile, Safari iOS, Samsung Internet et Firefox.
- [ ] Zéro décalage de viewport grâce à `viewport-fit=cover` et `touch-action: manipulation`.

---

## 7. Authentification par Code et Persistance du ChatBot

### 7.1 Contexte et sécurisation de session

- Connexion par Code : les codes avec espaces ou minuscules sont désormais assainis et trimés, le token JWT est synchronisé à la fois en cookie HttpOnly et en localStorage pour une compatibilité totale cross-origin et offline.
- ChatBot IA : les discussions sont persistées dans localStorage et transmises au backend pour maintenir le contexte avec Gemini.

### 7.2 Procédure de test pour l'authentification et le chat

1. Test Connexion par Code :
   - Se déconnecter de l'application.
   - Aller sur `/login`, saisir son adresse email et demander le code de vérification.
   - Saisir le code reçu (ou le code de test `000000` en environnement de test/dev).
   - Valider la connexion.
   - Résultat attendu : la connexion réussit immédiatement et redirige vers le Dashboard Client sans écran bloqué.
2. Test Persistance du ChatBot :
   - Ouvrir le ChatBot et poser une question : « Avez-vous des t-shirts rouges en taille L ? ».
   - Attendre la réponse du bot.
   - Naviguer vers `/boutique`, puis vers `/personnaliser/mon-design`, ou faire un rechargement complet (`Ctrl + F5`).
   - Réouvrir le ChatBot.
   - Résultat attendu : la conversation précédente est toujours affichée.
   - Poser une question de suivi : « Et pour les femmes ? ». Le bot comprend le contexte grâce à l'historique envoyé à l'API.
   - Tester le bouton réinitialiser (icône 🔄) dans l'en-tête du chat pour démarrer une nouvelle conversation.

---

## 8. Back-office UX/UI, Responsive Data Grids & Formulaires Complexes

### 8.1 Tableaux de Données Responsives (Commandes, Produits, Utilisateurs)
1. **Test Défilement Horizontal & Première Colonne Figée (Sticky First Column) :**
   - Accéder à `/admin_h_designer_sec_2024/orders`, `/admin_h_designer_sec_2024/products` ou `/admin_h_designer_sec_2024/users`.
   - Réduire la largeur d'écran (ou activer le responsive mode ~768px - 1024px).
   - Faire défiler le tableau horizontalement vers la droite.
   - **Résultat attendu :** La 1ère colonne (Référence `#HD-xxxxx` ou Nom/Visuel du Produit ou Nom du Client) reste parfaitement figée sur la gauche (`sticky left-0`) avec une ombre de démarcation subtile, garantissant la lisibilité même en fond de grille.
2. **Test Cartes Empilées (Mobile Stacked Cards) :**
   - Basculer en vue mobile (< 640px).
   - **Résultat attendu :** Chaque entrée s'affiche sous forme de carte individuelle ergonomique avec badges de statut et boutons d'action d'au moins 44px de hauteur (touch targets conformes WCAG).

### 8.2 Formulaire Produit en Stepper à 3 Étapes
1. Accéder à `/admin_h_designer_sec_2024/products` et cliquer sur « + Nouveau Produit ».
2. **Navigation par Étapes :**
   - **Étape 1 : Informations Générales** (Nom, Description, Catégorie, Collection, Prix, Stock). Remplir les champs puis cliquer sur « Suivant ».
   - **Étape 2 : Tailles & Visuel Principal** (Sélection des tailles XS à 3XL, upload image principale ou modèle 3D). Cliquer sur « Suivant ».
   - **Étape 3 : Variantes de Couleurs & Finalisation** (Gestion dynamique des couleurs et photos de variantes).
   - **Résultat attendu :** Pas de défilement vertical infini sur mobile/tablette. Les indicateurs d'étapes (pills numérotés 1, 2, 3) reflètent l'étape active.

### 8.3 Actions Destructrices Sécurisées (Modal à Double Étape)
1. Dans la liste des produits ou des utilisateurs, cliquer sur l'icône de suppression (poubelle rouge).
2. **Étape 1 du Modal :** Présentation du danger en rouge avec détails du produit/utilisateur ciblé.
3. **Étape 2 du Modal (Challenge de Sécurité) :**
   - Case à cocher de confirmation explicite OU saisie requise du mot « SUPPRIMER ».
   - Le bouton final « Confirmer la suppression » reste désactivé tant que la condition n'est pas remplie.
   - Lors de la validation, un indicateur de chargement (`Loader2`) s'affiche et désactive le clic pour prévenir le double déclenchement.
   - La touche `Échap` ou le clic hors modal permet d'annuler sans risque.

---

## 9. Persistance des Formulaires (Draft) & Prévention Double-Submit

### 9.1 Sauvegarde Automatique Brouillon (Drafting LocalStorage)
1. Ouvrir le formulaire d'ajout/édition de produit et commencer à remplir des informations (ex : Nom : « T-shirt Édition Spéciale », Prix : « 45 », etc.).
2. Sans soumettre, recharger la page (`F5`) ou fermer l'onglet puis revenir.
3. Réouvrir le formulaire produit.
4. **Résultat attendu :**
   - Les informations saisies sont automatiquement restaurées.
   - Un bandeau ambre d'information « Brouillon restauré automatiquement » apparaît avec un bouton « Effacer le brouillon » pour vider le cache en un clic si nécessaire.

### 9.2 Prévention du Double-Submit
1. Remplir un formulaire (produit, commande, utilisateur).
2. Cliquer sur le bouton de soumission ou sauvegarde.
3. **Résultat attendu :**
   - Le bouton passe instantanément en état `disabled` avec curseur `not-allowed`.
   - Un spinner de chargement animé (`Loader2`) remplace ou accompagne le texte.
   - Les clics frénétiques supplémentaires sont strictement sans effet, évitant tout doublon de ressource côté base de données.

---

## 10. Sécurité Backend Avancée (OWASP DevSecOps)

### 10.1 Rate Limiting Strict sur la Connexion Admin & Client
1. Effectuer 5 tentatives de connexion consécutives avec un mot de passe ou code erroné sur `/api/login`.
2. À la 6ème tentative :
   - **Résultat attendu :** Réponse HTTP **429 Too Many Requests** avec message de blocage temporaire (fenêtre de 15 minutes).

### 10.2 En-tête Anti-Indexation Global (X-Robots-Tag)
1. Inspecter les en-têtes de réponse réseau de n'importe quelle requête HTTP backend (`curl -I http://localhost:5000/api/products` ou via DevTools Network).
2. **Résultat attendu :** Présence de l'en-tête de sécurité :
   ```http
   X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
   ```
   L'indexation de l'application et de ses endpoints sensibles par les bots et moteurs de recherche est totalement bloquée.

### 10.3 Contrôle d'Accès BOLA (IDOR) et BFLA (RBAC)
1. **BOLA (Broken Object Level Authorization) :**
   - Un utilisateur non-admin tente d'accéder aux factures ou commandes d'un tiers via `/api/orders/:id/invoice` ou `/api/orders/:id`.
   - **Résultat attendu :** Rejet immédiat avec code **403 Forbidden** : `verifyOwnerOrAdmin` vérifie la stricte concordance entre le `userId` du token JWT et le propriétaire en DB.
2. **BFLA (Broken Function Level Authorization) :**
   - Un utilisateur avec le rôle `client` tente d'appeler un endpoint d'administration critique (ex: `PUT /api/orders/:id/status`, `DELETE /api/products/delete-product/:id`, `PUT /users/:id/role`).
   - **Résultat attendu :** Rejet avec code **403 Forbidden** (`verifyAdmin` côté serveur), même si le client manipule ou contourne le front-end.

### 10.4 Traçabilité et Audit Trail (`audit_logs`)
1. Réaliser une action critique dans le Back-Office :
   - Modification du prix d'un produit (ex: passage de 25€ à 30€).
   - Modification du statut d'une commande (ex: passage à `Livré` ou `Annulée`).
   - Suppression d'un produit ou d'un utilisateur.
   - Modification du rôle d'un utilisateur.
2. Interroger l'endpoint d'audit réservé aux administrateurs :
   `GET /api/admin/audit-logs`
3. **Résultat attendu :**
   - La table `audit_logs` enregistre l'événement avec :
     - `admin_id` et `admin_email` de l'opérateur
     - `action` (`UPDATE_PRODUCT_PRICE`, `UPDATE_ORDER_STATUS`, `DELETE_PRODUCT`, `UPDATE_USER_ROLE`, etc.)
     - `resource_type` et `resource_id`
     - `old_value` (valeur avant modification)
     - `new_value` (valeur après modification)
     - `ip_address` et horodatage précis `created_at`.

### 10.5 Assainissement Récursif des Entrées (Anti-XSS Middleware)
1. Tenter d'envoyer une charge utile contenant `<script>alert('xss')</script>` ou `<img src=x onerror=alert(1)>` dans la description d'un produit ou un champ texte.
2. **Résultat attendu :** Le middleware `sanitizeInputs` purifie récursivement l'ensemble des clés de `req.body`, `req.query` et `req.params`, éliminant les balises malveillantes avant toute requête en base de données.

---

---

## 12. Remédiation Complète Audit Technique, Légal & UX (P0, P1, P2)

### 12.1 Conformité Légale & Pages Réglementaires (P0)
1. **Accès et Contenu des Pages Juridiques :**
   - Accéder à `/mentions-legales` : Vérifier la présence du RCCM (`CI-ABJ-2024-B-12845`), Compte Contribuable (`2419827 Z`), coordonnées d'Abidjan et hébergeur Vercel.
   - Accéder à `/confidentialite` : Vérifier la conformité à la Loi ivoirienne n° 2013-450 (supervisée par l'ARTCI) et l'absence de stockage de données bancaires sensibles.
   - Accéder à `/cgv` : Vérifier les modalités de livraison à Abidjan/Intérieur et la clause expresse d'exception au droit de rétractation pour les articles textiles confectionnés sur mesure.
2. **Liens Footer :**
   - Vérifier que les liens du Footer « Mentions Légales », « Confidentialité », « CGV » ne pointent plus vers `#` mais ouvrent ces trois pages de manière fluide.
3. **Case d'Acceptation Obligatoire sur Inscription :**
   - Sur `/login` (mode Créer un compte), vérifier la présence de la case à cocher obligatoire pour les CGV et la Politique de Confidentialité. Tenter de soumettre sans cocher -> bloqué avec message explicite.

### 12.2 Qualité Catalogue & Purge des Données de Test (P0)
1. Ouvrir `/boutique` :
   - Vérifier que les articles de test (`dqssdqsdsqd`, `t-shirt vignted`, etc.) ont été nettoyés avec des dénominations, tarifs et descriptions premium.
   - Vérifier que les titres de cartes produits s'affichent proprement sur 2 lignes (`line-clamp-2`) sans troncature abrupte à 1 ligne.

### 12.3 Persistance des Filtres dans l'URL & Redirections (P1)
1. **Synchronisation d'URL sur `/boutique` :**
   - Sélectionner le filtre « Homme » et la catégorie « T-shirt ».
   - Constater que l'URL devient `/boutique?gender=Homme&category=T-shirt`.
   - Recharger la page (`F5`) ou copier le lien dans un nouvel onglet : les filtres sont instantanément restaurés.
2. **Redirection Permanente de l'Atelier :**
   - Taper directement `/personnalisation` ou `/personnaliser` dans la barre d'adresse : redirection automatique et instantanée vers `/personnaliser/mon-design`.

### 12.4 Persistance Automatique du Projet Canvas (P1)
1. Accéder à `/personnaliser/mon-design`, ajouter un texte ou un sticker sur le vêtement.
2. Quitter la page ou recharger le navigateur (`F5`).
3. Revenir sur l'Atelier : les calques et dimensions graphiques sont automatiquement rechargés depuis le `localStorage` avec notification de restauration.
4. Ajouter au panier : le brouillon temporaire est proprement purgé pour la création suivante.

### 12.5 Tunnel Panier / Checkout Accessible (P1)
1. Dans le `CartDrawer`, cliquer sur « Finaliser ma commande ».
2. Accès direct vers `/checkout` sans forcer un écran de blocage, permettant aussi bien l'achat connecté que le mode invité avec paiement Mobile Money / Cartes.

### 12.6 Ergonomie Mobile & Accessibilité WCAG (P2)
1. **Disposition Mobile des Boutons Flottants :**
   - En vue smartphone (< 768px), vérifier que le bouton WhatsApp (`bottom-20 left-4`) et le bouton Assistant IA (`bottom-20 right-4`) sont positionnés au-dessus de la barre de navigation inférieure sans chevaucher les boutons d'action.
2. **Accessibilité :**
   - Les icônes de la barre de navigation et les boutons de réseaux sociaux disposent d'attributs `aria-label` clairs pour les lecteurs d'écran.

---

## 13. Grille de Validation Finale Consolidée

| Catégorie | Fonctionnalité | Test Réalisé | Statut |
| :--- | :--- | :---: | :---: |
| **Légal P0** | Pages `/mentions-legales`, `/confidentialite`, `/cgv` conformes ARTCI | Routes & Footer | Validé |
| **Légal P0** | Case obligatoire CGV/Confidentialité sur formulaire inscription | Auth / Register | Validé |
| **Catalogue P0** | Nettoyage des fiches de test (`dqss...`, `vignted`) & line-clamp titres | Boutique / DB | Validé |
| **Routage P1** | Redirection `/personnalisation` -> `/personnaliser/mon-design` (308) | Routage & Vercel | Validé |
| **Persistance P1** | Filtres `/boutique` synchronisés avec l'URL (`useSearchParams`) | URL & Refresh | Validé |
| **Persistance P1** | Sauvegarde auto brouillon Canvas en `localStorage` | Customizer | Validé |
| **Tunnel P1** | Accès direct au Checkout depuis le Panier (Mode Invité / Client) | Cart Drawer | Validé |
| **Sécurité P2** | En-têtes HTTP de sécurité renforcés (`X-Frame-Options`, nosniff) | vercel.json | Validé |
| **UX Mobile P2** | Élévation des boutons flottants (WhatsApp / IA) au-dessus de la barre nav | Mobile Responsive | Validé |
| **Accessibilité P2** | Attributs `aria-label` sur boutons iconographiques (Panier, Auth, Nav) | WCAG 2.1 | Validé |
| **Admin UI** | Tableaux de données responsives & Sticky First Column | Orders/Products/Users | Validé |
| **Admin UI** | Stepper Produit en 3 étapes (Zéro scroll vertical excessif) | Création/Édition | Validé |
| **Admin UI** | Modal de confirmation destructive à double étape (Danger rouge) | Suppression Produits/Users | Validé |
| **Sécurité OWASP** | Rate Limiting strict sur `/api/login` (5 tentatives / 15 min) | Backend | Validé |
| **Sécurité OWASP** | Traçabilité Audit Trail DB (`audit_logs`) avec delta avant/après | Backend | Validé |
| **Sécurité OWASP** | Assainissement récursif des entrées anti-XSS (`sanitizeInputs`) | Middlewares | Validé |

---

## 14. Validation des Correctifs de Sécurité et Tunnel Transactionnel (Audit Volet 2)

| Catégorie | Vulnérabilité / Spécification | Mesure Implémentée | Fichiers Modifiés | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **Configuration** | Migration `VITE_DEV_OTP_BYPASS` -> `DEV_OTP_BYPASS` | Variable renommée de façon sécurisée sans casser la logique de vérification | `.env.local`, `.env`, `verifyEmail.js` | ✅ Validé |
| **Sécurité OWASP A04** | Client-Side Price Tampering (Manipulation des prix) | Recalcul strict et impératif des montants par le backend depuis la DB (`products`) et forçage du total DB lors de l'init Paystack | `orderController.js`, `paymentController.js` | ✅ Validé |
| **Sécurité OWASP A07** | Session Cleanup & Shared Device Risk (Cybercafés/Postes partagés) | Purge complète des clés sensibles (`cart`, `hdesigner_customizer_draft`), vidage `sessionStorage`, cookie révoqué et en-tête `Cache-Control: no-store` | `AuthContext.tsx`, `logout.js` | ✅ Validé |
| **Validation Entrées** | Faiblesses validation inscription (`/login`) & Téléphone ivoirien | Validation stricte par Regex du Nom/Prénom (`^[a-zA-ZÀ-ÿ\s'-]{2,50}$`), Téléphone ivoirien (`^(01\|05\|07)\d{8}$`), normalisation email et MDP min 8 car. | `register.js`, `Auth.tsx` | ✅ Validé |
| **Tunnel Checkout** | Sélecteur de commune Abidjan & frais de livraison dynamiques | Sélecteur de zones Abidjan (Cocody, Plateau, Marcory, Yopougon, Abobo...) + Intérieur avec calcul automatique et livraison offerte dès 50 000 FCFA | `Checkout.tsx`, `orderController.js` | ✅ Validé |
| **Format Monétaire** | Formatage hétérogène des prix (15,000 FCFA vs 15 000 FCFA) | Normalisation complète via `formatCurrency` avec séparateur d'espace français (`15 000 FCFA`) et zéro décimale | `constants/index.tsx`, `ProductCustomizer.tsx`, `Checkout.tsx` | ✅ Validé |
| **Support / SAV** | Suivi de commande interactif par référence / ticket | Formulaire de suivi en temps réel relié à l'endpoint sécurisé `/api/orders/track/:reference` sur la page `/aide-sav` | `HelpSupport.tsx`, `orderController.js`, `routes.js` | ✅ Validé |
| **Navigation & Tri** | Synchronisation des paramètres d'URL et nouveaux critères de tri | Support de `?q=`, `?gender=`, `?sort=newest`, `?sort=popular` avec mise à jour bidirectionnelle et état vide guidé | `Shop.tsx`, `Footer.tsx` | ✅ Validé |
| **Routage** | Conservation du paramètre de redirection après inscription | Support de `?redirect=/checkout` dans `Auth.tsx` pour rediriger automatiquement l'acheteur vers sa commande | `Auth.tsx` | ✅ Validé |


