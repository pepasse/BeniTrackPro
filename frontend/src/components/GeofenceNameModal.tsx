import { type FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import type { Vehicle } from '../store/vehiclesSlice';

interface GeofenceNameModalProps {
  vehicles: Vehicle[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: { name: string; vehicleId?: string }) => void;
  onClose: () => void;
}

const GeofenceNameModal = ({
  vehicles,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: GeofenceNameModalProps) => {
  const [name, setName] = useState('');
  const [vehicleId, setVehicleId] = useState<string>('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name: name.trim(), vehicleId: vehicleId || undefined });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">Nommer la zone</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="geofenceName" className="block text-sm text-text-muted">
              Nom de la zone
            </label>
            <input
              id="geofenceName"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrepôt Bonabéri"
              className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
            />
          </div>

          <div>
            <label htmlFor="vehicleScope" className="block text-sm text-text-muted">
              S'applique à
            </label>
            <select
              id="vehicleScope"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
            >
              <option value="">Toute la flotte</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.brand} {v.model}
                </option>
              ))}
            </select>
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
              {isSubmitting ? 'Création…' : 'Créer la zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeofenceNameModal;
