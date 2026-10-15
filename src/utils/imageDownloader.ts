import { BASE_IMG_URL } from '../components/images/VoirImage';

/**
 * 📥 Téléchargeur universel d'images Haute Définition (HD)
 * Gère parfaitement :
 * 1. Data URLs / Base64 (images IA, canvas exportés)
 * 2. URLs Cloudinary (extrait la version originale sans compression)
 * 3. URLs relatives ou absolues du serveur
 * 4. Fallback Canvas si CORS bloque le fetch standard
 */
export async function downloadHDImage(rawUrl: string, fileName = 'design_hd.png'): Promise<boolean> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    console.error("URL d'image invalide:", rawUrl);
    return false;
  }

  const cleanUrl = rawUrl.trim();

  // 1. SI C'EST UNE DATA URL (Base64 - ex: IA Pollinations / Canvas exporté)
  if (cleanUrl.startsWith('data:')) {
    try {
      const parts = cleanUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      triggerBlobDownload(blob, fileName);
      return true;
    } catch (err) {
      console.error("Erreur décodage Base64:", err);
    }
  }

  // 2. SI C'EST UN BLOB URL
  if (cleanUrl.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = cleanUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }

  // 3. CONSTRUCTION DE L'URL COMPLETE
  let fullUrl = cleanUrl;
  if (fullUrl.startsWith('h-designer/') || fullUrl.startsWith('v1')) {
    fullUrl = `https://res.cloudinary.com/dwyx9e7zw/image/upload/q_100,f_png/${fullUrl}`;
  } else if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    const relativeClean = fullUrl.replace(/^\/+/, '').replace(/^images\//, '');
    fullUrl = `${BASE_IMG_URL}${relativeClean}`;
  }

  // Si Cloudinary, on retire les filtres de réduction
  if (fullUrl.includes('res.cloudinary.com')) {
    fullUrl = fullUrl
      .replace(/\/w_\d+,c_[^\/]+/, '/q_100,f_png')
      .replace(/\/c_thumb,w_\d+/, '/q_100,f_png')
      .replace(/\/f_auto,q_auto[^\/]*\//, '/q_100,f_png/');
  }

  // 4. ESSAI VIA FETCH BLOB (Méthode la plus propre pour nommer le fichier)
  try {
    const res = await fetch(fullUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      triggerBlobDownload(blob, fileName);
      return true;
    }
  } catch (e) {
    console.warn("Échec fetch direct CORS pour téléchargement, bascule sur canvas/fallback...", e);
  }

  // 5. ESSAI VIA CANVAS HORS-ÉCRAN (Contourne les restrictions CORS directes pour le téléchargement)
  try {
    const success = await downloadViaImageElement(fullUrl, fileName);
    if (success) return true;
  } catch (e) {
    console.warn("Échec canvas fallback:", e);
  }

  // 6. ULTIME SECOURS : Lien direct avec balise <a>
  try {
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (e) {
    console.error("Erreur ultime de téléchargement:", e);
    return false;
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

function downloadViaImageElement(url: string, fileName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            triggerBlobDownload(blob, fileName);
            resolve(true);
          } else {
            resolve(false);
          }
        }, 'image/png');
      } catch (err) {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
