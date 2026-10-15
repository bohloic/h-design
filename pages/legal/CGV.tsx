import React from 'react';
import { ShoppingBag, Truck, RotateCcw, AlertTriangle, CreditCard, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CGV: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
        
        {/* En-tête */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <ShoppingBag className="w-8 h-8" />
            <span className="text-sm font-semibold uppercase tracking-wider">Conditions Contractuelles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Conditions Générales de Vente (CGV)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Applicables à compter du 15 octobre 2026. Conforme aux dispositions relatives au commerce électronique en Côte d'Ivoire.
          </p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              1. Objet et Dispositions Générales
            </h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent toutes les commandes passées sur la boutique en ligne <strong>H-DESIGNER</strong> (h-design-v1.vercel.app), exploitée par H-DESIGNER SARL (RCCM CI-ABJ-2024-B-12845). Toute commande implique l'acceptation sans réserve des présentes CGV par l'acheteur.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              2. Tarifs et Modalités de Paiement
            </h2>
            <p>
              Tous les prix sont libellés en <strong>Francs CFA (FCFA / XOF)</strong> et s'entendent toutes taxes comprises (TTC). Les modes de règlement acceptés sont :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600">
              <li><strong>Mobile Money :</strong> Orange Money, MTN Mobile Money, Moov Money et Wave.</li>
              <li><strong>Cartes Bancaires :</strong> Visa et Mastercard via notre passerelle agréée Paystack.</li>
              <li><strong>Paiement à la livraison :</strong> Disponible sur demande pour certaines zones d'Abidjan après confirmation téléphonique.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              3. Délais et Barème de Livraison
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Truck className="w-5 h-5 text-indigo-600" /> Abidjan Intra-Muros
                </div>
                <p className="text-sm text-slate-600">Livraison express en <strong>24h à 48h ouvrées</strong>. Tarif forfaitaire calculé automatiquement selon la commune (Cocody, Plateau, Marcory, Yopougon, etc.).</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Truck className="w-5 h-5 text-indigo-600" /> Intérieur du Pays
                </div>
                <p className="text-sm text-slate-600">Expédition via transporteurs partenaires agréés en <strong>48h à 72h ouvrées</strong> (Bouaké, San-Pedro, Yamoussoukro, Korhogo, etc.).</p>
              </div>
            </div>
          </section>

          {/* Section 4 - CRUCIALE POUR L'AUDIT */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-amber-600 rounded-full"></span>
              4. Droit de Rétractation et Exception Légale des Produits Personnalisés
            </h2>
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                Spécificité Légale des Articles Confectionnés sur Mesure
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">
                Conformément aux règles du droit de la consommation relatives aux biens confectionnés nettement personnalisés selon les spécifications du consommateur (notamment les t-shirts, débardeurs et vêtements personnalisés via l'Atelier en ligne) :
              </p>
              <ul className="list-disc pl-5 text-sm text-amber-950 space-y-1">
                <li>Le <strong>droit de rétractation ne s'applique pas</strong> aux articles personnalisés dès lors que la phase d'impression ou de confection a débuté.</li>
                <li>Pour les <strong>articles standards du catalogue non personnalisés</strong>, le client dispose d'un délai légal de <strong>7 jours ouvrés</strong> à compter de la réception pour demander un échange ou un remboursement.</li>
                <li>En cas de défaut manifeste de fabrication ou de non-conformité par rapport au BAT validé numériquement, H-DESIGNER s'engage à réimprimer l'article à ses frais ou à rembourser intégralement le client sous 48h.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              5. Validation du Bon à Tirer Numérique (BAT)
            </h2>
            <p>
              Lors de l'utilisation de l'Atelier de Personnalisation, le client prévisualise le rendu de son vêtement en 2D ou 3D. La validation de la commande vaut Bon à Tirer (BAT) définitif pour le positionnement, les couleurs et les dimensions du motif imprimé.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              6. Service Après-Vente et Litiges
            </h2>
            <p>
              Pour toute réclamation, notre SAV est à votre écoute par WhatsApp ou téléphone au <strong>+225 01 72 32 27 27</strong> ou par courriel à <strong>contact@h-designer.com</strong>. En cas de différend non résolu à l'amiable, les tribunaux compétents d'Abidjan seront seuls habilités.
            </p>
          </section>

          {/* Liens retour */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm font-semibold">
            <Link to="/mentions-legales" className="text-indigo-600 hover:underline">Consulter les Mentions Légales →</Link>
            <Link to="/confidentialite" className="text-indigo-600 hover:underline">Politique de Confidentialité →</Link>
            <Link to="/" className="text-slate-500 hover:text-slate-800 ml-auto">Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGV;
