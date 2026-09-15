import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Fuel, Gauge, Route as RouteIcon } from 'lucide-react';
import apiClient from '../config/apiClient';
import { API_ENDPOINTS } from '../config/constants';
import { useAppSelector } from '../store/hooks';
import TripHistoryMap from '../components/TripHistoryMap';
import RenewSubscriptionModal from '../components/RenewSubscriptionModal';
import type { Vehicle } from '../store/vehiclesSlice';

interface Subscription {
  id: string;
  status: 'active' | 'expired';
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
}

interface Payment {
  id: string;
  amount: string;
  currency: string;
  method?: string;
  reference?: string;
  newExpiresAt: string;
  paidAt: string;
}

interface Stats {
  distanceKm: number;
  estimatedFuelLiters: number;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  pointCount: number;
}

interface TripPoint {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

const toDateInputValue = (date: Date): string => date.toISOString().slice(0, 10);

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vehicleFromStore = useAppSelector((state) =>
    state.vehicles.items.find((v) => v.id === id)
  );

  const [vehicle, setVehicle] = useState<Vehicle | undefined>(vehicleFromStore);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<TripPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [from, setFrom] = useState(toDateInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toDateInputValue(new Date()));

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  // Charge le véhicule lui-même s'il n'est pas déjà dans le store (accès
  // direct à l'URL, ou rafraîchissement de la page).
  useEffect(() => {
    if (vehicleFromStore) {
      setVehicle(vehicleFromStore);
      return;
    }
    if (!id) return;
    apiClient.get<Vehicle>(API_ENDPOINTS.VEHICLES.GET_BY_ID(id)).then((res) => setVehicle(res.data));
  }, [id, vehicleFromStore]);

  const loadSubscription = async () => {
    if (!id) return;
    const [subRes, paymentsRes] = await Promise.all([
      apiClient.get<Subscription>(API_ENDPOINTS.VEHICLES.SUBSCRIPTION(id)),
      apiClient.get<Payment[]>(`${API_ENDPOINTS.VEHICLES.SUBSCRIPTION(id)}/payments`),
    ]);
    setSubscription(subRes.data);
    setPayments(paymentsRes.data);
  };

  const loadStatsAndHistory = async () => {
    if (!id) return;
    const fromIso = new Date(from).toISOString();
    const toIso = new Date(`${to}T23:59:59`).toISOString();

    const [statsRes, historyRes] = await Promise.all([
      apiClient.get<Stats>(API_ENDPOINTS.VEHICLES.STATS(id), { params: { from: fromIso, to: toIso } }),
      apiClient.get<TripPoint[]>(API_ENDPOINTS.VEHICLES.HISTORY(id), {
        params: { from: fromIso, to: toIso, limit: 1000 },
      }),
    ]);
    setStats(statsRes.data);
    setHistory(historyRes.data);
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([loadSubscription(), loadStatsAndHistory()]).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id || isLoading) return;
    loadStatsAndHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const handleRenew = async (payload: { amount: number; currency: string; method: string; reference: string }) => {
    if (!id) return;
    setIsRenewing(true);
    setRenewError(null);
    try {
      await apiClient.post(API_ENDPOINTS.VEHICLES.SUBSCRIPTION_RENEW(id), payload);
      await loadSubscription();
      setShowRenewModal(false);
    } catch (error) {
      setRenewError(extractErrorMessage(error, 'Impossible de renouveler l\'abonnement'));
    } finally {
      setIsRenewing(false);
    }
  };

  if (!vehicle) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink text-text-muted">
        Chargement du véhicule…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ink">
      <header className="flex items-center gap-4 border-b border-border px-6 py-3">
        <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-mono text-lg font-semibold text-text">{vehicle.plateNumber}</h1>
          <p className="text-xs text-text-muted">
            {vehicle.brand} {vehicle.model} {vehicle.year ? `· ${vehicle.year}` : ''}
          </p>
        </div>
      </header>

      <div className="flex flex-1 overflow-y-auto">
        {/* Colonne gauche : abonnement + stats */}
        <div className="w-96 shrink-0 space-y-4 overflow-y-auto border-r border-border p-5">
          {/* Abonnement */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-display text-sm font-semibold text-text">Abonnement</h2>
            {subscription ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      subscription.status === 'active' ? 'bg-signal' : 'bg-danger'
                    }`}
                  />
                  <span className="text-sm text-text">
                    {subscription.status === 'active' ? 'Actif' : 'Expiré'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {subscription.status === 'active'
                    ? `Expire dans ${subscription.daysRemaining} jour${subscription.daysRemaining > 1 ? 's' : ''} (${new Date(subscription.expiresAt).toLocaleDateString('fr-FR')})`
                    : `Expiré depuis le ${new Date(subscription.expiresAt).toLocaleDateString('fr-FR')}`}
                </p>
                <button
                  onClick={() => setShowRenewModal(true)}
                  className="mt-3 w-full rounded-md bg-amber px-3 py-2 text-sm font-semibold text-ink hover:bg-amber/90"
                >
                  Renouveler (payer)
                </button>

                {payments.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <h3 className="text-xs font-medium text-text-muted">Derniers paiements</h3>
                    <ul className="mt-2 space-y-2">
                      {payments.slice(0, 3).map((payment) => (
                        <li key={payment.id} className="flex items-center justify-between text-xs">
                          <span className="text-text-muted">
                            {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="font-mono text-text">
                            {Number(payment.amount).toLocaleString('fr-FR')} {payment.currency}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-text-muted">Chargement…</p>
            )}
          </div>

          {/* Statistiques */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-text">Statistiques</h2>
            </div>

            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-text-muted">Du</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-xs text-text outline-none focus:border-signal"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-muted">Au</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-xs text-text outline-none focus:border-signal"
                />
              </div>
            </div>

            {stats ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <RouteIcon size={16} className="text-signal" />
                  <div>
                    <div className="font-mono text-sm text-text">{stats.distanceKm} km</div>
                    <div className="text-xs text-text-muted">Distance parcourue</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Fuel size={16} className="text-amber" />
                  <div>
                    <div className="font-mono text-sm text-text">{stats.estimatedFuelLiters} L</div>
                    <div className="text-xs text-text-muted">Consommation estimée</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gauge size={16} className="text-text-muted" />
                  <div>
                    <div className="font-mono text-sm text-text">
                      {stats.avgSpeedKmh ?? '—'} km/h{' '}
                      <span className="text-text-muted">(max {stats.maxSpeedKmh ?? '—'})</span>
                    </div>
                    <div className="text-xs text-text-muted">Vitesse moyenne</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-muted">Chargement…</p>
            )}
          </div>
        </div>

        {/* Carte d'historique */}
        <div className="flex-1">
          {history.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              Aucune position GPS enregistrée sur cette période.
            </div>
          ) : (
            <TripHistoryMap points={history} />
          )}
        </div>
      </div>

      {showRenewModal && (
        <RenewSubscriptionModal
          isSubmitting={isRenewing}
          errorMessage={renewError}
          onSubmit={handleRenew}
          onClose={() => setShowRenewModal(false)}
        />
      )}
    </div>
  );
};

export default VehicleDetailPage;
