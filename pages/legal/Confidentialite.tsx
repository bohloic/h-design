import React from 'react';
import { ShieldCheck, Lock, Eye, Database, FileText, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Confidentialite: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
        
        {/* En-tête */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <ShieldCheck className="w-8 h-8" />
            <span className="text-sm font-semibold uppercase tracking-wider">Conformité ARTCI & RGPD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Politique de Confidentialité et Protection des Données
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Établie conformément à la Loi ivoirienne n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel (supervisée par l'ARTCI) et aux standards internationaux.
          </p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
              1. Engagement et Autorité de Régulation
            </h2>
            <p>
              H-DESIGNER s'engage solennellement à protéger la vie privée de ses clients et utilisateurs. La collecte et le traitement de vos données personnelles respectent scrupuleusement les exigences de l'<strong>Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
              2. Nature des Données Collectées
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Données d'Identification
                </h3>
                <p className="text-sm text-slate-600">Nom, prénom, adresse e-mail, numéro de téléphone mobile (requis pour le contact de livraison et le suivi SMS/WhatsApp).</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" /> Données de Commande
                </h3>
                <p className="text-sm text-slate-600">Adresse de livraison à Abidjan ou en région, historique d'achats, visuels et créations importés dans l'Atelier de personnalisation.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
              3. Sécurité des Paiements (Mobile Money & Cartes)
            </h2>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-700 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-900">Zéro stockage de données financières sensibles</h3>
                <p className="text-sm text-emerald-800 mt-1">
                  H-DESIGNER ne stocke à aucun moment vos codes secrets Mobile Money (Orange Money, MTN MoMo, Moov Money, Wave) ni vos numéros de cartes bancaires. L'ensemble des transactions financières est délégué à notre passerelle de paiement certifiée PCI-DSS (Paystack).
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
              4. Finalités du Traitement
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
              <li>Confection et impression de vos vêtements et accessoires personnalisés.</li>
              <li>Acheminement de vos colis à domicile ou au point relais.</li>
              <li>Attribution des points de fidélité au Club VIP H-Designer.</li>
              <li>Prévention des fraudes et sécurisation de l'infrastructure web.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
              5. Vos Droits (Accès, Rectification, Suppression)
            </h2>
            <p>
              Conformément à la loi n° 2013-450, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment :
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-sm font-medium text-slate-800">Par e-mail à notre Délégué à la Protection des Données :</span>
              <a href="mailto:contact@h-designer.com" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
                contact@h-designer.com
              </a>
            </div>
          </section>

          {/* Liens retour */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm font-semibold">
            <Link to="/mentions-legales" className="text-emerald-600 hover:underline">Consulter les Mentions Légales →</Link>
            <Link to="/cgv" className="text-emerald-600 hover:underline">Consulter les CGV →</Link>
            <Link to="/" className="text-slate-500 hover:text-slate-800 ml-auto">Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confidentialite;
