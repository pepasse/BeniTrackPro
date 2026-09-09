import type { Vehicle } from '../store/vehiclesSlice';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelect: (id: string) => void;
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

const VehicleList = ({ vehicles, selectedVehicleId, onSelect }: VehicleListProps) => {
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
          <li key={vehicle.id}>
            <button
              onClick={() => onSelect(vehicle.id)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                isSelected ? 'bg-surface-raised' : 'hover:bg-surface-raised/60'
              }`}
            >
              <div className="flex items-center justify-between">
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
          </li>
        );
      })}
    </ul>
  );
};

export default VehicleList;
