import { MapContainer, TileLayer, Circle, Polygon, Popup, useMapEvents } from 'react-leaflet';
import type { Geofence } from '../store/geofencesSlice';

const DOUALA_CENTER: [number, number] = [4.0511, 9.7679];

type DrawMode = 'none' | 'circle' | 'polygon';

interface GeofenceMapProps {
  geofences: Geofence[];
  drawMode: DrawMode;
  draftCenter: [number, number] | null;
  draftRadius: number;
  draftPoints: [number, number][];
  onMapClick: (latlng: [number, number]) => void;
}

// Composant interne : useMapEvents doit être utilisé à l'intérieur de MapContainer
const ClickHandler = ({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) => {
  useMapEvents({
    click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]),
  });
  return null;
};

const GeofenceMap = ({
  geofences,
  drawMode,
  draftCenter,
  draftRadius,
  draftPoints,
  onMapClick,
}: GeofenceMapProps) => {
  return (
    <MapContainer
      center={DOUALA_CENTER}
      zoom={12}
      className={`h-full w-full ${drawMode !== 'none' ? 'cursor-crosshair' : ''}`}
      zoomControl={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {drawMode !== 'none' && <ClickHandler onMapClick={onMapClick} />}

      {/* Zones existantes */}
      {geofences.map((geofence) => {
        if (geofence.type === 'circle' && geofence.centerLatitude != null && geofence.centerLongitude != null) {
          return (
            <Circle
              key={geofence.id}
              center={[geofence.centerLatitude, geofence.centerLongitude]}
              radius={geofence.radiusMeters ?? 0}
              pathOptions={{
                color: '#e8a33d',
                fillColor: '#e8a33d',
                fillOpacity: geofence.isActive ? 0.15 : 0.05,
                opacity: geofence.isActive ? 0.8 : 0.3,
              }}
            >
              <Popup>{geofence.name}</Popup>
            </Circle>
          );
        }
        if (geofence.type === 'polygon' && geofence.polygon && geofence.polygon.length >= 3) {
          return (
            <Polygon
              key={geofence.id}
              positions={geofence.polygon.map((p) => [p.latitude, p.longitude])}
              pathOptions={{
                color: '#e8a33d',
                fillColor: '#e8a33d',
                fillOpacity: geofence.isActive ? 0.15 : 0.05,
                opacity: geofence.isActive ? 0.8 : 0.3,
              }}
            >
              <Popup>{geofence.name}</Popup>
            </Polygon>
          );
        }
        return null;
      })}

      {/* Aperçu en cours de dessin */}
      {drawMode === 'circle' && draftCenter && (
        <Circle
          center={draftCenter}
          radius={draftRadius}
          pathOptions={{ color: '#3fbfad', fillColor: '#3fbfad', fillOpacity: 0.2, dashArray: '6 4' }}
        />
      )}
      {drawMode === 'polygon' && draftPoints.length > 0 && (
        <Polygon
          positions={draftPoints}
          pathOptions={{ color: '#3fbfad', fillColor: '#3fbfad', fillOpacity: 0.2, dashArray: '6 4' }}
        />
      )}
    </MapContainer>
  );
};

export default GeofenceMap;
