import React from 'react';
import { Gift, Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-8 px-4 border-t border-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        {/* COLONNE 1 : MARQUE */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="christmas-font text-3xl font-bold text-red-500 group-hover:text-red-400 transition-colors">H-design</span>
            <Gift className="text-green-500 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Votre destination mode préférée pour des fêtes inoubliables. Nous célébrons l'élégance et la magie de Noël avec style.
          </p>
          <div className="flex space-x-3">
            <a href="#" className="p-2.5 bg-slate-900 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                <Facebook size={18} />
            </a>
            <a href="#" className="p-2.5 bg-slate-900 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                <Instagram size={18} />
            </a>
            <a href="#" className="p-2.5 bg-slate-900 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                <Twitter size={18} />
            </a>
          </div>
        </div>

        {/* COLONNE 2 : LIENS */}
        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-wider border-b border-red-900/30 pb-2 inline-block">Liens Utiles</h4>
          <ul className="space-y-3 text-sm">
            <li>
                <Link to="/" className="flex items-center gap-2 hover:text-red-500 transition-colors group">
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"/> Accueil
                </Link>
            </li>
            <li>
                <Link to="/boutique" className="flex items-center gap-2 hover:text-red-500 transition-colors group">
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"/> Boutique
                </Link>
            </li>
            <li>
                <Link to="/dashboard" className="flex items-center gap-2 hover:text-red-500 transition-colors group">
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"/> Mon Compte
                </Link>
            </li>
            <li>
                <a href="#" className="flex items-center gap-2 hover:text-red-500 transition-colors group">
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"/> Aide & SAV
                </a>
            </li>
          </ul>
        </div>

        {/* COLONNE 3 : CATÉGORIES */}
        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-wider border-b border-red-900/30 pb-2 inline-block">Catégories</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-red-400 transition-colors">Collection Noël</a></li>
            <li><a href="#" className="hover:text-red-400 transition-colors">Hommes</a></li>
            <li><a href="#" className="hover:text-red-400 transition-colors">Femmes</a></li>
            <li><a href="#" className="hover:text-red-400 transition-colors">Enfants</a></li>
          </ul>
        </div>

        {/* COLONNE 4 : CONTACT */}
        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-wider border-b border-red-900/30 pb-2 inline-block">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start space-x-3 group">
              <Phone className="text-red-500 w-5 h-5 flex-shrink-0 group-hover:text-green-500 transition-colors" />
              <span className="group-hover:text-white transition-colors">+225 07 07 07 07 07</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <Mail className="text-red-500 w-5 h-5 flex-shrink-0 group-hover:text-green-500 transition-colors" />
              <span className="group-hover:text-white transition-colors">noel@festiv-elegance.com</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <MapPin className="text-red-500 w-5 h-5 flex-shrink-0 group-hover:text-green-500 transition-colors" />
              <span className="group-hover:text-white transition-colors">Boulevard de Noël, Abidjan, Côte d'Ivoire</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* COPYRIGHT */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
        <p>© 2024 H-design. Joyeux Noël et Heureuse Année !</p>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#" className="hover:text-red-500 transition-colors">Mentions Légales</a>
          <a href="#" className="hover:text-red-500 transition-colors">Politique de Confidentialité</a>
          <a href="#" className="hover:text-red-500 transition-colors">CGV</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;