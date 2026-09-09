import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '../store/vehiclesSlice';

const DOUALA_CENTER: [number, number] = [4.0511, 9.7679];

const buildIcon = (isSelected: boolean, isStale: boolean) => {
  const color = isStale ? '#8b96ac' : isSelected ? '#e8a33d' : '#3fbfad';
  const size = isSelected ? 16 : 12;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px; height:${size}px; border-radius:9999px;
        background:${color}; border:2px solid #0b1220;
        box-shadow: 0 0 0 2px ${color}55;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Recentre/ajuste la vue quand la liste de positions change (nouveaux
// véhicules chargés, ou sélection d'un véhicule précis).
const MapController = ({
  positions,
  focusedPosition,
}: {
  positions: [number, number][];
  focusedPosition: [number, number] | null;
}) => {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (focusedPosition) {
      map.setView(focusedPosition, 15, { animate: true });
      return;
    }
    if (!hasFitOnce.current && positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 14 });
      hasFitOnce.current = true;
    }
  }, [map, positions, focusedPosition]);

  return null;
};

interface VehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelect: (id: string) => void;
}

const isPositionStale = (iso?: string): boolean => {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > 15 * 60 * 1000; // >15 min
};

const VehicleMap = ({ vehicles, selectedVehicleId, onSelect }: VehicleMapProps) => {
  const located = vehicles.filter(
    (v): v is Vehicle & { lastLatitude: number; lastLongitude: number } =>
      typeof v.lastLatitude === 'number' && typeof v.lastLongitude === 'number'
  );

  const positions = useMemo<[number, number][]>(
    () => located.map((v) => [v.lastLatitude, v.lastLongitude]),
    [located]
  );

  const selectedVehicle = located.find((v) => v.id === selectedVehicleId);
  const focusedPosition: [number, number] | null = selectedVehicle
    ? [selectedVehicle.lastLatitude, selectedVehicle.lastLongitude]
    : null;

  return (
    <MapContainer center={DOUALA_CENTER} zoom={12} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController positions={positions} focusedPosition={focusedPosition} />

      {located.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.lastLatitude, vehicle.lastLongitude]}
          icon={buildIcon(vehicle.id === selectedVehicleId, isPositionStale(vehicle.lastLocationAt))}
          eventHandlers={{ click: () => onSelect(vehicle.id) }}
        >
          <Popup>
            <div className="font-sans text-sm">
              <div className="font-semibold">{vehicle.plateNumber}</div>
              <div className="text-gray-600">
                {vehicle.brand} {vehicle.model}
              </div>
              {typeof vehicle.lastSpeedKmh === 'number' && (
                <div className="mt-1">{Math.round(vehicle.lastSpeedKmh)} km/h</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default VehicleMap;
