import React from 'react';
import { Gift, Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowRight, MessageSquare } from 'lucide-react';
import logoLight from '../../assets/Logo .png';
import logoDark from '../../assets/Logo2.png';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  // Année dynamique pour le copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-carbon text-slate-300 pt-16 pb-8 px-4 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        {/* COLONNE 1 : MARQUE */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center group">
            <img 
              src={logoLight} 
              alt="H-Designer Logo" 
              className="h-16 w-auto group-hover:opacity-80 transition-opacity object-contain"
            />
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Votre destination mode premium à Abidjan. Nous créons des designs uniques et des accessoires d'exception pour sublimer votre élégance au quotidien.
          </p>
          <div className="flex space-x-3">
            {[Facebook, Instagram, Twitter].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="p-2.5 bg-slate-900 rounded-xl hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover-theme-bg"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* COLONNE 2 : LIENS UTILS */}
        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-wider pb-2 inline-block border-b-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}>
            Liens Utiles
          </h4>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'Accueil', path: '/' },
              { label: 'Boutique', path: '/boutique' },
              { label: 'Mon Compte', path: '/dashboard' },
              { label: 'Aide & SAV', path: '/aide-sav' },
            ].map((link, idx) => (
              <li key={idx}>
                <Link to={link.path} className="flex items-center gap-2 transition-colors group hover-theme-text">
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-primary)' }}/> 
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLONNE 3 : CATÉGORIES */}
        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-wider pb-2 inline-block border-b-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}>
            Collections
          </h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover-theme-text transition-colors">T-shirt personnalisé</a></li>
            <li><a href="#" className="hover-theme-text transition-colors">Prêt-à-porter Homme</a></li>
            <li><a href="#" className="hover-theme-text transition-colors">Prêt-à-porter Femme</a></li>
            <li><a href="#" className="hover-theme-text transition-colors">Nouveautés</a></li>
          </ul>
        </div>

        {/* COLONNE 4 : CONTACT */}
        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-wider pb-2 inline-block border-b-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}>
            Contact
          </h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start space-x-3 group">
              <Phone className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: 'var(--theme-primary)' }} />
              <span className="group-hover:text-white transition-colors">+225 01 72 32 27 27</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <Mail className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: 'var(--theme-primary)' }} />
              <span className="group-hover:text-white transition-colors">contact@h-designer.ci</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <MapPin className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: 'var(--theme-primary)' }} />
              <span className="group-hover:text-white transition-colors">Abidjan, Côte d'Ivoire</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* COPYRIGHT */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
        <p>© {currentYear} H-Designer. Tous droits réservés.</p>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#" className="hover-theme-text transition-colors">Mentions Légales</a>
          <a href="#" className="hover-theme-text transition-colors">Confidentialité</a>
          <a href="#" className="hover-theme-text transition-colors">CGV</a>
        </div>
      </div>

      {/* 🪄 STYLES DYNAMIQUES */}
      <style>{`
        .hover-theme-bg:hover {
            background-color: var(--theme-primary) !important;
        }
        .hover-theme-text:hover {
            color: var(--theme-primary) !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;