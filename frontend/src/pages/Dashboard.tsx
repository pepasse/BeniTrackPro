import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { logout } from '../store/authSlice';
import {
  fetchVehicles,
  selectVehicle,
  applyLiveLocation,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  clearMutationError,
  type Vehicle,
  type VehicleInput,
} from '../store/vehiclesSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  getSocket,
  subscribeToVehicle,
  unsubscribeFromVehicle,
  type VehicleLocationEvent,
  type SubscriptionWarningEvent,
} from '../services/socket';
import VehicleList from '../components/VehicleList';
import VehicleMap from '../components/VehicleMap';
import VehicleFormModal from '../components/VehicleFormModal';

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { items: vehicles, selectedVehicleId, status, mutationError } = useAppSelector(
    (state) => state.vehicles
  );

  const [warning, setWarning] = useState<SubscriptionWarningEvent | null>(null);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; vehicle?: Vehicle } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Abonne le socket à chaque véhicule de la flotte dès qu'elle est chargée,
  // pour recevoir la position de tous les véhicules en temps réel — pas
  // seulement celui actuellement sélectionné dans la liste.
  useEffect(() => {
    if (vehicles.length === 0) return;

    const socket = getSocket();
    vehicles.forEach((vehicle) => subscribeToVehicle(vehicle.id));

    const handleLocation = (payload: VehicleLocationEvent) => {
      dispatch(applyLiveLocation(payload));
    };
    const handleWarning = (payload: SubscriptionWarningEvent) => {
      setWarning(payload);
    };

    socket.on('vehicle:location', handleLocation);
    socket.on('subscription:warning', handleWarning);

    return () => {
      vehicles.forEach((vehicle) => unsubscribeFromVehicle(vehicle.id));
      socket.off('vehicle:location', handleLocation);
      socket.off('subscription:warning', handleWarning);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles.map((v) => v.id).join(',')]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const openCreateModal = () => {
    dispatch(clearMutationError());
    setModal({ mode: 'create' });
  };

  const openEditModal = (vehicle: Vehicle) => {
    dispatch(clearMutationError());
    setModal({ mode: 'edit', vehicle });
  };

  const closeModal = () => {
    setModal(null);
    dispatch(clearMutationError());
  };

  const handleFormSubmit = async (input: VehicleInput) => {
    setIsSubmitting(true);
    const action =
      modal?.mode === 'edit' && modal.vehicle
        ? await dispatch(updateVehicle({ id: modal.vehicle.id, ...input }))
        : await dispatch(createVehicle(input));
    setIsSubmitting(false);

    if (action.type.endsWith('/fulfilled')) {
      setModal(null);
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
    const confirmed = window.confirm(
      `Supprimer le véhicule ${vehicle.plateNumber} ? Cette action est irréversible.`
    );
    if (confirmed) {
      dispatch(deleteVehicle(vehicle.id));
    }
  };

  return (
    <div className="flex h-screen flex-col bg-ink">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="font-display text-lg font-semibold text-text">BeniTrackPro</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/geofences')}
            className="text-sm text-text-muted hover:text-text"
          >
            Géofencing
          </button>
          <span className="text-sm text-text-muted">{user?.fullName}</span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      {warning && (
        <div className="flex items-center justify-between border-b border-amber/40 bg-amber-dim/40 px-6 py-2.5 text-sm text-amber">
          <span>
            ⚠️ Un abonnement expire dans {warning.daysRemaining} jour
            {warning.daysRemaining > 1 ? 's' : ''}.
          </span>
          <button onClick={() => setWarning(null)} className="text-amber/70 hover:text-amber">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-text">
              Véhicules {vehicles.length > 0 && <span className="text-text-muted">({vehicles.length})</span>}
            </h2>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1 rounded-md bg-amber px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-amber/90"
            >
              <Plus size={14} />
              Nouveau
            </button>
          </div>
          {status === 'loading' && vehicles.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">Chargement…</div>
          ) : (
            <VehicleList
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              onSelect={(id) => dispatch(selectVehicle(id))}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onOpenDetail={(vehicle) => navigate(`/vehicles/${vehicle.id}`)}
            />
          )}
        </aside>

        <main className="flex-1">
          <VehicleMap
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelect={(id) => dispatch(selectVehicle(id))}
          />
        </main>
      </div>

      {modal && (
        <VehicleFormModal
          mode={modal.mode}
          initialVehicle={modal.vehicle}
          isSubmitting={isSubmitting}
          errorMessage={mutationError}
          onSubmit={handleFormSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default DashboardPage;
