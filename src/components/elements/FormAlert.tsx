import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface FormAlertProps {
  type: 'error' | 'success' | 'info' | null;
  message: string | null;
  onClose?: () => void;
}

const FormAlert: React.FC<FormAlertProps> = ({ type, message, onClose }) => {
  if (!message || !type) return null;

  const styles = {
    error: 'bg-red-50 text-red-600 border-red-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100'
  };

  const icons = {
    error: <AlertCircle size={20} className="flex-shrink-0" />,
    success: <CheckCircle2 size={20} className="flex-shrink-0" />,
    info: <AlertCircle size={20} className="flex-shrink-0" />
  };

  return (
    <div className={`p-4 mb-6 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${styles[type]}`}>
      {icons[type]}
      <div className="flex-1">
        <p className="text-sm font-bold leading-tight">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Fermer l'alerte"
          title="Fermer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default FormAlert;
