# Guide Intégration - Configurateur 3D de Vetements

Documentation technique pour l'equipe produit et les infographistes.
Reference : composant model-viewer (Google/Three.js) + API pbrMetallicRoughness

---

## 1. Prerequis logiciels

| Outil | Version | Usage |
|---|---|---|
| Blender | 4.x LTS | Modelisation + export GLTF/GLB |
| GLTF Transform | npx @gltf-transform/cli | Optimisation du fichier |
| Cloudinary | (compte existant) | Hebergement CDN du .glb |

---

## 2. Nommage des materiaux dans Blender - CRITIQUE

Le script JS cible les materiaux par leur nom exact dans Blender.
Il cherche un materiau contenant l'un de ces mots-cles (insensible casse) :

  fabric, tissu, tshirt, t-shirt, shirt, body, cloth, garment, textile, material

### Convention de nommage recommandee

| Partie du vetement      | Nom du materiau Blender   |
|-------------------------|---------------------------|
| Corps principal T-shirt | Tshirt_Material            |
| Etiquette interieure    | Label_Material             |
| Coutures                | Seam_Material              |
| Boutons / zip           | Button_Metal               |

Exemple dans Blender :
  Objet : T-Shirt_Body
    Materiau : [Tshirt_Material]   <- cible par le script JS
  Objet : T-Shirt_Label
    Materiau : [Label_Material]    <- ignore par le script JS

Regle d'or : si vous n'avez qu'un seul materiau, le script l'appliquera
automatiquement quel que soit son nom.

---

## 3. Reglages Blender avant export

### Materiau tissu - Principled BSDF

  Base Color  -> Blanc (#FFFFFF)  <- OBLIGATOIRE, sera remplace par JS
  Roughness   -> 0.85
  Metallic    -> 0.0
  Subsurface  -> 0.05
  Sheen       -> 0.3

Toujours definir la Base Color a blanc. Le code JS applique ensuite la
couleur choisie par multiplication - un blanc pur garantit un rendu fidele.

### Baked Shadows - pour le realisme

1. Cuire (Bake) une texture AO + Shadow dans Blender
2. Connecter au canal Roughness du BSDF (PAS Base Color)
3. Les plis et ombres restent visibles meme quand la couleur change

---

## 4. Export GLTF/GLB depuis Blender

Parametres recommandes :
  Format : glTF Binary (.glb)
  Include Selected Objects : OUI
  Export Materials -> PBR Material : OUI
  Compression : Draco (niveau 7)
  Export Normals : OUI
  Export UV Maps : OUI
  Export Vertex Colors : NON
  Export Cameras : NON
  Export Lights : NON

Commande d'optimisation post-export :
  npx @gltf-transform/cli optimize tshirt_blanc.glb tshirt_opt.glb \
    --compress draco \
    --texture-compress webp \
    --texture-resize 1024

Taille cible : < 2 Mo pour un bon chargement mobile.

---

## 5. Hebergement sur Cloudinary

Upload via API Cloudinary (type : raw) :
  curl -X POST https://api.cloudinary.com/v1_1/dwyx9e7zw/raw/upload \
    -F "file=@tshirt_opt.glb" \
    -F "upload_preset=h-designer" \
    -F "folder=models-3d"

URL resultante :
  https://res.cloudinary.com/dwyx9e7zw/raw/upload/v.../models-3d/tshirt_opt.glb

IMPORTANT : utiliser le type de ressource "raw" pour les .glb (pas "image").

---

## 6. Champ model_url dans la base de donnees

Ajout de la colonne SQL :
  ALTER TABLE products ADD COLUMN model_url VARCHAR(512) DEFAULT NULL;

Remplissage :
  UPDATE products
  SET model_url = 'https://res.cloudinary.com/dwyx9e7zw/raw/upload/v.../tshirt.glb'
  WHERE id = 42;

Un seul modele 3D par famille de vetement suffit.
La couleur est appliquee dynamiquement par JS pour toutes les variantes.

---

## 7. Comment le script JS cible les materiaux

// Extrait simplifie de pages/products/ProductDetails.tsx

const applyColorToModel = (hex) => {
  const mv = document.querySelector('model-viewer');
  if (!mv?.model?.materials) return;

  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const rgbaFactor = [r, g, b, 1.0];

  const FABRIC_KEYWORDS = ['fabric', 'tissu', 'tshirt', 'shirt', 'body', 'cloth'];

  const materials = mv.model.materials;
  const fabricMats = materials.filter(m =>
    FABRIC_KEYWORDS.some(kw => m.name.toLowerCase().includes(kw))
  );
  const targets = fabricMats.length > 0 ? fabricMats : materials;

  targets.forEach(mat => {
    mat.pbrMetallicRoughness.setBaseColorFactor(rgbaFactor);
  });
};

---

## 8. Synchronisation avec le panier

Le champ cache <input name="selected_color"> est mis a jour a chaque
changement de couleur et inclus dans le payload panier :

  {
    "options": {
      "color": "Bleu Marine",
      "colorHex": "#172554",
      "selected_color": "SKU-BM-L",
      "customization": null
    }
  }

- Variant catalogue -> selected_color = SKU du variant
- Couleur libre     -> selected_color = code HEX pour la production

---

## 9. Checklist avant mise en production

- [ ] Modele .glb < 2 Mo
- [ ] Materiau principal nomme avec un mot-cle tissu (voir §2)
- [ ] Base Color blanc (#FFFFFF) dans Blender
- [ ] Ombres baked sur canal Roughness (pas Base Color)
- [ ] model_url rempli dans la BDD pour le produit
- [ ] Test chargement mobile (Chrome DevTools -> Slow 3G)
- [ ] Test changement de couleur sur au moins 3 variantes
