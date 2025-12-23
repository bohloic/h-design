
import React from 'react';
import { Gift, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="christmas-font text-3xl font-bold text-red-500">Festiv'Élégance</span>
            <Gift className="text-green-500 w-6 h-6" />
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Votre destination mode préférée pour des fêtes inoubliables. Nous célébrons l'élégance et la magie de Noël avec style.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-red-500 transition-colors"><Facebook size={20} /></a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-red-500 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-red-500 transition-colors"><Twitter size={20} /></a>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-widest">Liens Utiles</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-red-500 transition-colors">Accueil</Link></li>
            <li><Link to="/boutique" className="hover:text-red-500 transition-colors">Boutique</Link></li>
            <li><Link to="/dashboard" className="hover:text-red-500 transition-colors">Mon Compte</Link></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Aide & SAV</a></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-widest">Catégories</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-red-500 transition-colors">Collection Noël</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Hommes</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Femmes</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Enfants</a></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-bold text-lg uppercase tracking-widest">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center space-x-3">
              <Phone className="text-red-500 w-5 h-5" />
              <span>+225 07 07 07 07 07</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="text-red-500 w-5 h-5" />
              <span>noel@festiv-elegance.com</span>
            </li>
            <li className="flex items-center space-x-3">
              <MapPin className="text-red-500 w-5 h-5" />
              <span>Boulevard de Noël, Abidjan, Côte d'Ivoire</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
        <p>© 2024 Festiv'Élégance Boutique. Joyeux Noël et Heureuse Année !</p>
        <div className="flex space-x-8">
          <a href="#" className="hover:text-white">Mentions Légales</a>
          <a href="#" className="hover:text-white">Politique de Confidentialité</a>
          <a href="#" className="hover:text-white">Conditions Générales</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
