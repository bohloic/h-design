import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';

interface ConfirmDestructiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  itemName?: string;
  confirmWord?: string; // Mot de passe ou mot-clé de sécurité (ex: 'SUPPRIMER')
  requireTyping?: boolean; // Exige la saisie manuelle du mot
  isLoading?: boolean;
}

export const ConfirmDestructiveModal: React.FC<ConfirmDestructiveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmWord = 'SUPPRIMER',
  requireTyping = false,
  isLoading = false
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [typedConfirm, setTypedConfirm] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTypedConfirm('');
      setIsChecked(false);
      setInternalLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !internalLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, internalLoading, onClose]);

  if (!isOpen) return null;

  const handleProceedToStep2 = () => {
    setStep(2);
  };

  const handleFinalConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isConfirmed = requireTyping 
    ? typedConfirm.trim().toUpperCase() === confirmWord.toUpperCase()
    : isChecked;

  const loadingState = isLoading || internalLoading;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Danger */}
        <div className="p-6 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs border border-red-200">
              <ShieldAlert size={26} />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-red-200/80 text-red-800">
                Action Destructrice • Étape {step}/2
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loadingState}
            style={{ touchAction: 'manipulation' }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X size={20} className="pointer-events-none" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-4">
          {itemName && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Cible concernée :</span>
              <span className="font-bold text-slate-800 break-all">{itemName}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed">
            {message}
          </p>

          {step === 1 ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Attention : action irréversible</span>
              </div>
              <p>Cette suppression supprimera définitivement les données associées de la base de données. Une seconde validation est requise.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2 animate-in fade-in duration-200">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900">
                <p className="font-bold mb-1">Confirmation finale requise</p>
                {requireTyping ? (
                  <p>Veuillez taper <strong className="font-mono bg-white px-2 py-0.5 rounded border border-red-200 text-red-700">{confirmWord}</strong> ci-dessous pour débloquer l'action :</p>
                ) : (
                  <p>Cochez la case ci-dessous pour certifier que vous comprenez les conséquences de cette suppression :</p>
                )}
              </div>

              {requireTyping ? (
                <input
                  type="text"
                  value={typedConfirm}
                  onChange={(e) => setTypedConfirm(e.target.value)}
                  placeholder={`Tapez ${confirmWord} ici...`}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-sm focus:border-red-500 focus:bg-white outline-none transition-all uppercase"
                  autoFocus
                />
              ) : (
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Je confirme vouloir supprimer définitivement cet élément et accepte les répercussions.
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer avec boutons nettement séparés */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingState}
            style={{ touchAction: 'manipulation' }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToStep2}
              style={{ touchAction: 'manipulation' }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 text-white font-black text-sm shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continuer la suppression</span>
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalConfirm}
              disabled={!isConfirmed || loadingState}
              style={{ touchAction: 'manipulation' }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 text-white font-black text-sm shadow-xl shadow-red-300 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {loadingState ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Suppression en cours...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Confirmer la suppression définitive</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDestructiveModal;
