import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { apiGet, SessionExpiredError, Vehicle } from './api';
import TripMap, { TripPoint } from './TripMap';
import { colors } from './theme';

interface Stats {
  distanceKm: number;
  estimatedFuelLiters: number;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  pointCount: number;
}

interface Subscription {
  status: string;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
}

interface HistoryPoint extends TripPoint {
  recordedAt: string;
}

const PERIODS = [
  { key: '24h', label: '24 h', ms: 24 * 3600 * 1000 },
  { key: '7j', label: '7 jours', ms: 7 * 24 * 3600 * 1000 },
  { key: '30j', label: '30 jours', ms: 30 * 24 * 3600 * 1000 },
] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const fmtNum = (n: number | null | undefined, unit: string, digits = 1) =>
  n == null ? '—' : `${n.toFixed(digits)} ${unit}`;

export default function VehicleDetailScreen({
  vehicle,
  onBack,
  onLogout,
}: {
  vehicle: Vehicle;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('24h');
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [trip, setTrip] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [error, setError] = useState('');

  // Bouton retour Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setHistoryError('');
    const ms = PERIODS.find((p) => p.key === period)!.ms;
    const from = encodeURIComponent(new Date(Date.now() - ms).toISOString());
    const base = `/api/vehicles/${vehicle.id}`;

    const [sub, st, hist] = await Promise.allSettled([
      apiGet<Subscription>(`${base}/subscription`),
      apiGet<Stats>(`${base}/stats?from=${from}`),
      apiGet<HistoryPoint[]>(`${base}/history?from=${from}&limit=1000`),
    ]);

    const expired = [sub, st, hist].some(
      (r) => r.status === 'rejected' && r.reason instanceof SessionExpiredError
    );
    if (expired) {
      onLogout();
      return;
    }

    if (sub.status === 'fulfilled') setSubscription(sub.value);
    if (st.status === 'fulfilled') setStats(st.value);
    else setError(st.reason?.message || 'Statistiques indisponibles');

    if (hist.status === 'fulfilled') {
      setTrip([...hist.value].reverse()); // l'API renvoie du plus récent au plus ancien
    } else {
      setTrip([]);
      setHistoryError(hist.reason?.message || 'Historique indisponible');
    }
    setLoading(false);
  }, [vehicle.id, period, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const days = subscription?.daysRemaining ?? null;
  const subExpired = days != null && days <= 0;
  const subSoon = days != null && days > 0 && days <= 30;
  const subColor = subExpired ? colors.danger : subSoon ? colors.amber : colors.signal;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={s.back}>‹ Retour</Text>
        </Pressable>
        <View style={[s.dot, { backgroundColor: vehicle.status === 'active' ? colors.signal : colors.muted }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.plate}>{vehicle.plateNumber}</Text>
        <Text style={s.sub}>{vehicle.brand} {vehicle.model}</Text>
        {vehicle.lastLocationAt && (
          <Text style={s.sub}>
            Dernière position : {new Date(vehicle.lastLocationAt).toLocaleString('fr-FR')}
            {vehicle.lastSpeedKmh != null ? ` · ${Math.round(vehicle.lastSpeedKmh)} km/h` : ''}
          </Text>
        )}

        {/* Abonnement */}
        <View style={[s.card, { borderColor: subColor }]}>
          <Text style={s.cardTitle}>Abonnement</Text>
          {subscription ? (
            <>
              <Text style={[s.big, { color: subColor }]}>
                {subExpired ? 'Expiré' : `${days} jour${days === 1 ? '' : 's'} restant${days === 1 ? '' : 's'}`}
              </Text>
              <Text style={s.sub}>
                {subExpired ? 'Expiré le ' : 'Expire le '}
                {fmtDate(subscription.expiresAt)}
              </Text>
              {subExpired && (
                <Text style={s.warn}>Le suivi est suspendu. Renouvelle l'abonnement depuis le site web.</Text>
              )}
              {subSoon && <Text style={s.warn}>Pense à renouveler bientôt.</Text>}
            </>
          ) : (
            <Text style={s.sub}>Information indisponible.</Text>
          )}
        </View>

        {/* Période */}
        <View style={s.tabs}>
          {PERIODS.map((p) => (
            <Pressable key={p.key} onPress={() => setPeriod(p.key)} style={[s.tab, period === p.key && s.tabOn]}>
              <Text style={[s.tabText, period === p.key && { color: '#000' }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.amber} style={{ marginTop: 32 }} />
        ) : (
          <>
            {!!error && <Text style={s.errorText}>{error}</Text>}
            {stats && (
              <View style={s.grid}>
                <Stat label="Distance" value={fmtNum(stats.distanceKm, 'km')} />
                <Stat label="Carburant estimé" value={fmtNum(stats.estimatedFuelLiters, 'L')} />
                <Stat label="Vitesse moyenne" value={fmtNum(stats.avgSpeedKmh, 'km/h', 0)} />
                <Stat label="Vitesse max" value={fmtNum(stats.maxSpeedKmh, 'km/h', 0)} />
              </View>
            )}

            <Text style={s.section}>Trajet</Text>
            {historyError ? (
              <Text style={s.errorText}>{historyError}</Text>
            ) : trip.length === 0 ? (
              <Text style={s.sub}>Aucune position sur cette période.</Text>
            ) : (
              <>
                <View style={s.mapBox}>
                  <TripMap points={trip} />
                </View>
                <Text style={[s.sub, { marginTop: 6 }]}>{trip.length} position{trip.length > 1 ? 's' : ''}</Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={s.stat}>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={s.statValue}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: colors.amber, fontSize: 16, fontWeight: '600' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  plate: { color: colors.text, fontSize: 28, fontWeight: '700' },
  sub: { color: colors.muted, marginTop: 2, fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 16 },
  cardTitle: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', marginBottom: 6 },
  big: { fontSize: 22, fontWeight: '700' },
  warn: { color: colors.amber, marginTop: 8, fontSize: 13 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 8, padding: 2, marginTop: 20, alignSelf: 'flex-start' },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  tabOn: { backgroundColor: colors.amber },
  tabText: { color: colors.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  stat: { width: '48%', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  statLabel: { color: colors.muted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  section: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  mapBox: { height: 280, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  errorText: { color: colors.danger, marginTop: 12 },
});
