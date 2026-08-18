import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Mail, KeyRound, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleResetPassword: (identifier: string, newPassword?: string) => Promise<boolean>;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  handleResetPassword
}) => {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setIdentifier('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('request');
    setErrorMessage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Veuillez saisir votre identifiant ou votre adresse email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const ok = await handleResetPassword(identifier);
      if (ok) {
        setStep('reset');
      } else {
        setErrorMessage('Identifiant ou email introuvable.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('Le nouveau mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const ok = await handleResetPassword(identifier, newPassword);
      if (ok) {
        setStep('success');
      } else {
        setErrorMessage('Impossible de réinitialiser le mot de passe.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Réinitialisation du mot de passe">
      <div className="space-y-5">
        {step === 'request' && (
          <form onSubmit={onRequestSubmit} className="space-y-4">
            <p className="text-sm text-gray-300">
              Saisissez votre identifiant ou adresse email enregistrée auprès du système NIGELEC DISI.
            </p>

            {errorMessage && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Identifiant / Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ex: admin ou client@nigelec.ne"
                  className="input-field w-full pl-12 h-13 text-sm"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1 py-3 text-sm font-bold rounded-xl"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <span>Continuer</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div className="p-3 bg-brand/10 border border-brand/30 rounded-xl text-brand text-xs">
              Compte vérifié pour <strong className="font-bold">{identifier}</strong>. Saisissez votre nouveau mot de passe.
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full pl-12 h-13 text-sm"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full pl-12 h-13 text-sm"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="btn-secondary flex-1 py-3 text-sm font-bold rounded-xl"
                disabled={isLoading}
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Changer mot de passe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-lg font-bold text-white">Mot de passe réinitialisé !</h4>
            <p className="text-sm text-gray-300">
              Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.
            </p>
            <button
              onClick={handleClose}
              className="btn-primary w-full py-3 font-bold rounded-xl mt-4"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
