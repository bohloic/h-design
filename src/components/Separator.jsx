
import { Star } from 'lucide-react'; // Ou une autre icône

export const Separator = () => {
  return (
    <hr className="my-12 border-t border-slate-200" />
  );
};

export const GradientSeparator = () => {
  return (
    <div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50" />
  );
};


export const LabeledSeparator = ({ label }) => {
  return (
    <div className="relative flex py-12 items-center">
      {/* La ligne de gauche */}
      <div className="flex-grow border-t border-slate-200"></div>
      
      {/* Le contenu du milieu */}
      <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
        {label ? label : <Star size={16} />} {/* Affiche le texte ou une étoile par défaut */}
      </span>

      {/* La ligne de droite */}
      <div className="flex-grow border-t border-slate-200"></div>
    </div>
  );
};
