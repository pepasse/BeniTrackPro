import { type FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Vehicle, VehicleInput, VehicleType } from '../store/vehiclesSlice';

interface VehicleFormModalProps {
  mode: 'create' | 'edit';
  initialVehicle?: Vehicle;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: VehicleInput) => void;
  onClose: () => void;
}

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Voiture' },
  { value: 'truck', label: 'Camion' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'van', label: 'Camionnette' },
  { value: 'other', label: 'Autre' },
];

const VehicleFormModal = ({
  mode,
  initialVehicle,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: VehicleFormModalProps) => {
  const [plateNumber, setPlateNumber] = useState(initialVehicle?.plateNumber ?? '');
  const [brand, setBrand] = useState(initialVehicle?.brand ?? '');
  const [model, setModel] = useState(initialVehicle?.model ?? '');
  const [year, setYear] = useState(initialVehicle?.year?.toString() ?? '');
  const [type, setType] = useState<VehicleType>(initialVehicle?.type ?? 'car');
  const [rfidTag, setRfidTag] = useState(initialVehicle?.rfidTag ?? '');

  // Ferme sur Échap, comme attendu de toute boîte de dialogue
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      plateNumber: plateNumber.trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: year ? parseInt(year, 10) : undefined,
      type,
      rfidTag: rfidTag.trim() || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">
            {mode === 'create' ? 'Nouveau véhicule' : 'Modifier le véhicule'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="plateNumber" className="block text-sm text-text-muted">
              Plaque d'immatriculation
            </label>
            <input
              id="plateNumber"
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="CE-1234-AB"
              className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text outline-none focus:border-signal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="brand" className="block text-sm text-text-muted">
                Marque
              </label>
              <input
                id="brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Toyota"
                className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm text-text-muted">
                Modèle
              </label>
              <input
                id="model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Hilux"
                className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="year" className="block text-sm text-text-muted">
                Année
              </label>
              <input
                id="year"
                type="number"
                min={1980}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2022"
                className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm text-text-muted">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as VehicleType)}
                className="mt-1.5 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-signal"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rfidTag" className="block text-sm text-text-muted">
              Tag RFID <span className="text-text-muted/60">(optionnel)</span>
            </label>
            <input
              id="rfidTag"
              type="text"
              value={rfidTag}
              onChange={(e) => setRfidTag(e.target.value)}
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
              {isSubmitting ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default VehicleFormModal;
