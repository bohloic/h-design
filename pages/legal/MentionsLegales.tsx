import React from 'react';
import { ShieldCheck, Building2, Mail, Phone, MapPin, Globe, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MentionsLegales: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
        
        {/* En-tête */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center gap-3 text-[var(--theme-primary)] mb-2">
            <Building2 className="w-8 h-8" />
            <span className="text-sm font-semibold uppercase tracking-wider">Informations Légales & Réglementaires</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Mentions Légales
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Conforme à la Loi ivoirienne n° 2013-546 du 30 juillet 2013 relative aux transactions électroniques.
          </p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-[var(--theme-primary)] rounded-full"></span>
              1. Éditeur de la Plateforme
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
              <p><strong>Dénomination sociale :</strong> H-DESIGNER SARL</p>
              <p><strong>Capital social :</strong> 1 000 000 FCFA</p>
              <p><strong>Siège social :</strong> Boulevard Latrille, Cocody Deux-Plateaux, Abidjan, République de Côte d'Ivoire</p>
              <p><strong>Immatriculation RCCM :</strong> CI-ABJ-2024-B-12845 (Tribunal de Commerce d'Abidjan)</p>
              <p><strong>Compte Contribuable (DFE) :</strong> 2419827 Z</p>
              <p><strong>Direction de la publication :</strong> Direction Générale H-Designer</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-[var(--theme-primary)] rounded-full"></span>
              2. Coordonnées et Service Client
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <Phone className="w-5 h-5 text-[var(--theme-primary)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Téléphone & WhatsApp</h3>
                  <p className="text-slate-600">+225 01 72 32 27 27</p>
                  <p className="text-xs text-slate-400 mt-1">Du lundi au samedi : 08h30 - 18h30</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <Mail className="w-5 h-5 text-[var(--theme-primary)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Courrier électronique</h3>
                  <p className="text-slate-600">contact@h-designer.com</p>
                  <p className="text-xs text-slate-400 mt-1">Réponse sous 24h ouvrées</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-[var(--theme-primary)] rounded-full"></span>
              3. Hébergement de l'Infrastructure
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <p><strong>Prestataire d'hébergement :</strong> Vercel Inc.</p>
              <p><strong>Adresse de l'hébergeur :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p><strong>Site Web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[var(--theme-primary)] hover:underline">https://vercel.com</a></p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-6 bg-[var(--theme-primary)] rounded-full"></span>
              4. Propriété Intellectuelle et Marques
            </h2>
            <p>
              L'ensemble des éléments graphiques, photographies, maquettes 3D, codes sources, logos, designs générés et marques figurant sur le site H-Designer sont la propriété exclusive de H-DESIGNER SARL ou de ses partenaires artistes indépendants.
            </p>
            <p className="mt-2">
              Toute reproduction, distribution ou diffusion, intégrale ou partielle, sans l'accord préalable écrit de H-DESIGNER SARL est strictement interdite et sanctionnée par les dispositions de l'Organisation Africaine de la Propriété Intellectuelle (OAPI) et le Code de la propriété intellectuelle.
            </p>
          </section>

          {/* Liens retour */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm font-semibold">
            <Link to="/cgv" className="text-[var(--theme-primary)] hover:underline">Consulter les CGV →</Link>
            <Link to="/confidentialite" className="text-[var(--theme-primary)] hover:underline">Politique de Confidentialité →</Link>
            <Link to="/" className="text-slate-500 hover:text-slate-800 ml-auto">Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;
