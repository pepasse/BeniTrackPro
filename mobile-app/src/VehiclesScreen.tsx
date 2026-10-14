import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import MapWebView, { MapFocus } from './MapWebView';
import { apiGet, SessionExpiredError, Vehicle } from './api';
import { closeSocket, getSocket } from './socket';
import { colors } from './theme';

interface LocationEvent {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  recordedAt: string;
}

export default function VehiclesScreen({ onLogout }: { onLogout: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'map' | 'list'>('map');
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      setVehicles(await apiGet<Vehicle[]>('/api/vehicles'));
    } catch (e: any) {
      if (e instanceof SessionExpiredError) onLogout();
      else setError(e.message || 'Chargement impossible');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  // Positions en direct
  const ids = vehicles.map((v) => v.id).join(',');
  useEffect(() => {
    if (!ids) return;
    const socket = getSocket();
    const subscribeAll = () => ids.split(',').forEach((id) => socket.emit('subscribe:vehicle', id));
    const onLocation = (e: LocationEvent) =>
      setVehicles((list) =>
        list.map((v) =>
          v.id === e.vehicleId
            ? {
                ...v,
                status: 'active',
                lastLatitude: e.latitude,
                lastLongitude: e.longitude,
                lastSpeedKmh: e.speedKmh ?? null,
                lastLocationAt: e.recordedAt,
              }
            : v
        )
      );
    socket.on('connect', subscribeAll);
    socket.on('vehicle:location', onLocation);
    if (socket.connected) subscribeAll();
    return () => {
      socket.off('connect', subscribeAll);
      socket.off('vehicle:location', onLocation);
    };
  }, [ids]);

  useEffect(() => () => closeSocket(), []);

  const focus = (v: Vehicle) => {
    if (v.lastLatitude == null || v.lastLongitude == null) return;
    setView('map');
    setMapFocus({ latitude: v.lastLatitude, longitude: v.lastLongitude, key: Date.now() });
  };

  const located = vehicles.filter((v) => v.lastLatitude != null && v.lastLongitude != null);

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Flotte</Text>
        <View style={s.tabs}>
          {(['map', 'list'] as const).map((t) => (
            <Pressable key={t} onPress={() => setView(t)} style={[s.tab, view === t && s.tabOn]}>
              <Text style={[s.tabText, view === t && { color: '#000' }]}>{t === 'map' ? 'Carte' : 'Liste'}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onLogout}>
          <Text style={s.logout}>Quitter</Text>
        </Pressable>
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      {view === 'map' ? (
        <MapWebView
          focus={mapFocus}
          markers={located.map((v) => ({
            id: v.id,
            latitude: v.lastLatitude!,
            longitude: v.lastLongitude!,
            label: `${v.plateNumber} · ${v.brand} ${v.model}${v.lastSpeedKmh != null ? ` · ${Math.round(v.lastSpeedKmh)} km/h` : ''}`,
            active: v.status === 'active',
          }))}
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor={colors.amber}
              onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={<Text style={s.empty}>Aucun véhicule.</Text>}
          renderItem={({ item }) => (
            <Pressable style={s.card} onPress={() => focus(item)}>
              <View style={{ flex: 1 }}>
                <Text style={s.plate}>{item.plateNumber}</Text>
                <Text style={s.meta}>{item.brand} {item.model}</Text>
                {item.lastLocationAt && (
                  <Text style={s.meta}>
                    Dernière position : {new Date(item.lastLocationAt).toLocaleTimeString('fr-FR')}
                    {item.lastSpeedKmh != null ? ` · ${Math.round(item.lastSpeedKmh)} km/h` : ''}
                  </Text>
                )}
              </View>
              <View style={[s.dot, { backgroundColor: item.status === 'active' ? colors.signal : colors.muted }]} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: 48 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', flex: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 8, padding: 2 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  tabOn: { backgroundColor: colors.amber },
  tabText: { color: colors.muted, fontWeight: '600' },
  logout: { color: colors.muted },
  error: { color: colors.danger, paddingHorizontal: 16, paddingBottom: 8 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  plate: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, marginTop: 2, fontSize: 13 },
  dot: { width: 12, height: 12, borderRadius: 6, marginLeft: 12 },
});
