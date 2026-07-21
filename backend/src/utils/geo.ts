// Utilitaires géographiques pour le géofencing

export interface LatLng {
  latitude: number;
  longitude: number;
}

// Distance entre deux points GPS en mètres (formule de Haversine)
export const haversineDistanceMeters = (a: LatLng, b: LatLng): number => {
  const R = 6371000; // rayon moyen de la Terre en mètres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};

export const isPointInCircle = (point: LatLng, center: LatLng, radiusMeters: number): boolean => {
  return haversineDistanceMeters(point, center) <= radiusMeters;
};

// Algorithme du ray casting (impair-pair) pour un polygone simple (non auto-intersectant)
export const isPointInPolygon = (point: LatLng, polygon: LatLng[]): boolean => {
  let inside = false;
  const x = point.longitude;
  const y = point.latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};
