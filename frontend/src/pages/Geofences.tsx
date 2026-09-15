import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Circle as CircleIcon, Hexagon, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchVehicles } from '../store/vehiclesSlice';
import {
  fetchGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
  clearMutationError,
  type Geofence,
} from '../store/geofencesSlice';
import GeofenceMap from '../components/GeofenceMap';
import GeofenceNameModal from '../components/GeofenceNameModal';

type DrawMode = 'none' | 'circle' | 'polygon';

const MIN_RADIUS = 100;
const MAX_RADIUS = 5000;

const GeofencesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: geofences } = useAppSelector((state) => state.geofences);
  const { items: vehicles } = useAppSelector((state) => state.vehicles);
  const mutationError = useAppSelector((state) => state.geofences.mutationError);

  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [draftCenter, setDraftCenter] = useState<[number, number] | null>(null);
  const [draftRadius, setDraftRadius] = useState(300);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchGeofences());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const resetDraft = () => {
    setDrawMode('none');
    setDraftCenter(null);
    setDraftRadius(300);
    setDraftPoints([]);
  };

  const handleMapClick = (latlng: [number, number]) => {
    if (drawMode === 'circle') {
      setDraftCenter(latlng);
    } else if (drawMode === 'polygon') {
      setDraftPoints((prev) => [...prev, latlng]);
    }
  };

  const canFinishPolygon = draftPoints.length >= 3;

  const handleSaveShape = async (input: { name: string; vehicleId?: string }) => {
    setIsSubmitting(true);
    const payload =
      drawMode === 'circle' && draftCenter
        ? {
            name: input.name,
            type: 'circle' as const,
            centerLatitude: draftCenter[0],
            centerLongitude: draftCenter[1],
            radiusMeters: draftRadius,
            vehicleId: input.vehicleId,
          }
        : {
            name: input.name,
            type: 'polygon' as const,
            polygon: draftPoints.map(([latitude, longitude]) => ({ latitude, longitude })),
            vehicleId: input.vehicleId,
          };

    const action = await dispatch(createGeofence(payload));
    setIsSubmitting(false);

    if (action.type.endsWith('/fulfilled')) {
      setShowNameModal(false);
      resetDraft();
    }
  };

  const handleToggleActive = (geofence: Geofence) => {
    dispatch(updateGeofence({ id: geofence.id, isActive: !geofence.isActive }));
  };

  const handleDelete = (geofence: Geofence) => {
    if (window.confirm(`Supprimer la zone "${geofence.name}" ?`)) {
      dispatch(deleteGeofence(geofence.id));
    }
  };

  const vehiclePlate = (vehicleId?: string) =>
    vehicleId ? vehicles.find((v) => v.id === vehicleId)?.plateNumber ?? '—' : 'Toute la flotte';

  return (
    <div className="flex h-screen flex-col bg-ink">
      <header className="flex items-center gap-4 border-b border-border px-6 py-3">
        <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold text-text">Géofencing</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 shrink-0 overflow-y-auto border-r border-border bg-surface p-5">
          {drawMode === 'none' ? (
            <>
              <h2 className="font-display text-sm font-semibold text-text">Nouvelle zone</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDrawMode('circle')}
                  className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface-raised px-4 py-4 text-sm text-text hover:border-signal"
                >
                  <CircleIcon size={20} className="text-signal" />
                  Cercle
                </button>
                <button
                  onClick={() => setDrawMode('polygon')}
                  className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface-raised px-4 py-4 text-sm text-text hover:border-signal"
                >
                  <Hexagon size={20} className="text-signal" />
                  Polygone
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-signal/40 bg-signal-dim/20 p-4">
              <h2 className="font-display text-sm font-semibold text-text">
                {drawMode === 'circle' ? 'Zone circulaire' : 'Zone polygonale'}
              </h2>

              {drawMode === 'circle' && !draftCenter && (
                <p className="mt-2 text-sm text-text-muted">Cliquez sur la carte pour placer le centre.</p>
              )}

              {drawMode === 'circle' && draftCenter && (
                <>
                  <p className="mt-2 text-sm text-text-muted">Ajustez le rayon de la zone.</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>Rayon</span>
                      <span className="font-mono text-text">{draftRadius} m</span>
                    </div>
                    <input
                      type="range"
                      min={MIN_RADIUS}
                      max={MAX_RADIUS}
                      step={50}
                      value={draftRadius}
                      onChange={(e) => setDraftRadius(parseInt(e.target.value, 10))}
                      className="mt-1.5 w-full accent-signal"
                    />
                  </div>
                  <button
                    onClick={() => setShowNameModal(true)}
                    className="mt-4 w-full rounded-md bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber/90"
                  >
                    Suivant
                  </button>
                </>
              )}

              {drawMode === 'polygon' && (
                <>
                  <p className="mt-2 text-sm text-text-muted">
                    Cliquez pour ajouter des points ({draftPoints.length} placé
                    {draftPoints.length > 1 ? 's' : ''}, 3 minimum).
                  </p>
                  <button
                    onClick={() => setShowNameModal(true)}
                    disabled={!canFinishPolygon}
                    className="mt-4 w-full rounded-md bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber/90 disabled:opacity-40"
                  >
                    Terminer le tracé
                  </button>
                </>
              )}

              <button
                onClick={resetDraft}
                className="mt-2 w-full rounded-md border border-border px-4 py-2 text-sm text-text-muted hover:text-text"
              >
                Annuler
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <h2 className="font-display text-sm font-semibold text-text">
              Zones existantes {geofences.length > 0 && <span className="text-text-muted">({geofences.length})</span>}
            </h2>

            {geofences.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">Aucune zone créée pour le moment.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {geofences.map((geofence) => (
                  <li
                    key={geofence.id}
                    className="rounded-md border border-border bg-surface-raised px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">{geofence.name}</span>
                      <button
                        onClick={() => handleDelete(geofence)}
                        className="text-text-muted hover:text-danger"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
                      <span>
                        {geofence.type === 'circle' ? 'Cercle' : 'Polygone'} · {vehiclePlate(geofence.vehicleId)}
                      </span>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={geofence.isActive}
                          onChange={() => handleToggleActive(geofence)}
                          className="accent-signal"
                        />
                        Active
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1">
          <GeofenceMap
            geofences={geofences}
            drawMode={drawMode}
            draftCenter={draftCenter}
            draftRadius={draftRadius}
            draftPoints={draftPoints}
            onMapClick={handleMapClick}
          />
        </main>
      </div>

      {showNameModal && (
        <GeofenceNameModal
          vehicles={vehicles}
          isSubmitting={isSubmitting}
          errorMessage={mutationError}
          onSubmit={handleSaveShape}
          onClose={() => {
            setShowNameModal(false);
            dispatch(clearMutationError());
          }}
        />
      )}
    </div>
  );
};

export default GeofencesPage;
