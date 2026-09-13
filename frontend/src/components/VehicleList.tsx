import { Pencil, Trash2 } from 'lucide-react';
import type { Vehicle } from '../store/vehiclesSlice';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelect: (id: string) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const statusLabel: Record<Vehicle['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  maintenance: 'Maintenance',
};

const statusColor: Record<Vehicle['status'], string> = {
  active: 'bg-signal',
  inactive: 'bg-text-muted',
  maintenance: 'bg-amber',
};

const formatLastSeen = (iso?: string): string => {
  if (!iso) return 'Jamais localisé';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return `il y a ${Math.round(diffH / 24)} j`;
};

const VehicleList = ({ vehicles, selectedVehicleId, onSelect, onEdit, onDelete }: VehicleListProps) => {
  if (vehicles.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-text-muted">
        Aucun véhicule enregistré pour le moment.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {vehicles.map((vehicle) => {
        const isSelected = vehicle.id === selectedVehicleId;
        return (
          <li key={vehicle.id} className={`group relative ${isSelected ? 'bg-surface-raised' : 'hover:bg-surface-raised/60'}`}>
            <button onClick={() => onSelect(vehicle.id)} className="w-full px-4 py-3 text-left">
              <div className="flex items-center justify-between pr-14">
                <span className="font-mono text-sm font-medium text-text">
                  {vehicle.plateNumber}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColor[vehicle.status]}`} />
                  {statusLabel[vehicle.status]}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                {vehicle.brand} {vehicle.model}
                {vehicle.year ? ` · ${vehicle.year}` : ''}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-text-muted">{formatLastSeen(vehicle.lastLocationAt)}</span>
                {typeof vehicle.lastSpeedKmh === 'number' && (
                  <span className="font-mono text-signal">{Math.round(vehicle.lastSpeedKmh)} km/h</span>
                )}
              </div>
            </button>

            <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(vehicle)}
                className="rounded p-1 text-text-muted hover:bg-surface hover:text-text"
                aria-label="Modifier"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(vehicle)}
                className="rounded p-1 text-text-muted hover:bg-surface hover:text-danger"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default VehicleList;
