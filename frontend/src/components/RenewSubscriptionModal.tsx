import { type FormEvent, useState } from 'react';
import { X } from 'lucide-react';

interface RenewSubscriptionModalProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (payload: { amount: number; currency: string; method: string; reference: string }) => void;
  onClose: () => void;
}

const RenewSubscriptionModal = ({
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: RenewSubscriptionModalProps) => {
  const [amount, setAmount] = useState('25000');
  const [method, setMethod] = useState('mobile_money');
  const [reference, setReference] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      amount: parseFloat(amount),
      currency: 'XAF',
      method,
      reference: reference.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">Renouveler l'abonnement</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Enregistre un paiement reçu et prolonge l'abonnement d'un an.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm text-text-muted">
              Montant (XAF)
            </label>
            <input
              id="amount"
              type="number"
              required
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text outline-none focus:border-signal"
            />
          </div>

          <div>
            <label htmlFor="method" className="block text-sm text-text-muted">
              Moyen de paiement
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
            >
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="cash">Espèces</option>
            </select>
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm text-text-muted">
              Référence <span className="text-text-muted/60">(optionnel)</span>
            </label>
            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="ID de transaction"
              className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text outline-none focus:border-signal"
            />
          </div>

          {errorMessage && (
            <div className="rounded-md border border-danger-dim bg-danger-dim/30 px-3 py-2 text-sm text-danger">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm text-text-muted hover:text-text"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber/90 disabled:opacity-60"
            >
              {isSubmitting ? 'Traitement…' : 'Confirmer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenewSubscriptionModal;
