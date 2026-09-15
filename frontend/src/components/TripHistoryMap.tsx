import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

interface TripPoint {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

interface TripHistoryMapProps {
  points: TripPoint[];
}

const DOUALA_CENTER: [number, number] = [4.0511, 9.7679];

const FitToRoute = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [30, 30], maxZoom: 15 });
    }
  }, [map, positions]);

  return null;
};

const TripHistoryMap = ({ points }: TripHistoryMapProps) => {
  // L'API renvoie l'historique du plus récent au plus ancien : on inverse
  // pour tracer le trajet dans l'ordre chronologique.
  const chronological = [...points].reverse();
  const positions: [number, number][] = chronological.map((p) => [p.latitude, p.longitude]);

  return (
    <MapContainer center={DOUALA_CENTER} zoom={12} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.length > 0 && <FitToRoute positions={positions} />}

      {positions.length > 1 && (
        <Polyline positions={positions} pathOptions={{ color: '#3fbfad', weight: 3, opacity: 0.8 }} />
      )}

      {positions.length > 0 && (
        <>
          <CircleMarker
            center={positions[0]}
            radius={6}
            pathOptions={{ color: '#0b1220', weight: 2, fillColor: '#8b96ac', fillOpacity: 1 }}
          />
          <CircleMarker
            center={positions[positions.length - 1]}
            radius={7}
            pathOptions={{ color: '#0b1220', weight: 2, fillColor: '#e8a33d', fillOpacity: 1 }}
          />
        </>
      )}
    </MapContainer>
  );
};

export default TripHistoryMap;
