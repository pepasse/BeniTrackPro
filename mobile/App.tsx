import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const STORAGE_KEY = 'benitrackpro:settings';
const SEND_INTERVAL_MS = 5000;

type Status = 'idle' | 'starting' | 'tracking' | 'error';

export default function App() {
  const [serverUrl, setServerUrl] = useState('http://192.168.1.10:5000');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const watcher = useRef<Location.LocationSubscription | null>(null);
  const sending = useRef(false);

  // Recharge les réglages sauvegardés
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.serverUrl) setServerUrl(s.serverUrl);
          if (s.apiKey) setApiKey(s.apiKey);
        }
      } catch {
        // pas grave, on garde les valeurs par défaut
      }
      setLoaded(true);
    })();
  }, []);

  const send = useCallback(
    async (loc: Location.LocationObject) => {
      if (sending.current) return;
      sending.current = true;
      try {
        const { latitude, longitude, speed, heading } = loc.coords;
        const body: Record<string, unknown> = {
          latitude,
          longitude,
          recordedAt: new Date(loc.timestamp).toISOString(),
        };
        if (speed != null && speed >= 0) body.speedKmh = Math.round(speed * 3.6 * 10) / 10;
        if (heading != null && heading >= 0) body.heading = Math.round(heading);

        setLastCoords({ lat: latitude, lng: longitude });

        const res = await fetch(`${serverUrl.replace(/\/+$/, '')}/api/devices/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey.trim() },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          setSentCount((n) => n + 1);
          setLastSentAt(new Date());
          setMessage('');
        } else {
          setFailCount((n) => n + 1);
          if (res.status === 401) setMessage('Clé API invalide ou révoquée.');
          else if (res.status === 402) setMessage("Abonnement du véhicule expiré. Il faut le renouveler.");
          else setMessage(`Le serveur a répondu ${res.status}.`);
        }
      } catch {
        setFailCount((n) => n + 1);
        setMessage('Serveur injoignable. Vérifie le Wi-Fi et l’adresse.');
      } finally {
        sending.current = false;
      }
    },
    [serverUrl, apiKey]
  );

  const start = async () => {
    if (!apiKey.trim() || !serverUrl.trim()) {
      Alert.alert('Réglages incomplets', "Renseigne l'adresse du serveur et la clé API.");
      return;
    }
    setStatus('starting');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ serverUrl, apiKey }));
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('error');
        setMessage('Permission de localisation refusée.');
        return;
      }
      await activateKeepAwakeAsync();
      setSentCount(0);
      setFailCount(0);
      watcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: SEND_INTERVAL_MS,
          distanceInterval: 0,
        },
        send
      );
      setStatus('tracking');
    } catch (e) {
      setStatus('error');
      setMessage('Impossible de démarrer le suivi.');
    }
  };

  const stop = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
    deactivateKeepAwake();
    setStatus('idle');
  }, []);

  useEffect(() => stop, [stop]);

  const tracking = status === 'tracking';

  if (!loaded) {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <ActivityIndicator color="#f5a524" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.brand}>BeniTrackPro</Text>
          <Text style={s.subtitle}>Balise du chauffeur</Text>

          <View style={s.badgeRow}>
            <View style={[s.dot, { backgroundColor: tracking ? '#22c55e' : '#6b7280' }]} />
            <Text style={s.badgeText}>{tracking ? 'Suivi en cours' : 'Suivi arrêté'}</Text>
          </View>

          <Text style={s.label}>Adresse du serveur</Text>
          <TextInput
            style={s.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            editable={!tracking}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.10:5000"
            placeholderTextColor="#6b7280"
          />

          <Text style={s.label}>Clé API du véhicule</Text>
          <TextInput
            style={s.input}
            value={apiKey}
            onChangeText={setApiKey}
            editable={!tracking}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="btp_..."
            placeholderTextColor="#6b7280"
          />

          <Pressable
            style={[s.button, tracking ? s.stop : s.start]}
            onPress={tracking ? stop : start}
            disabled={status === 'starting'}
          >
            {status === 'starting' ? (
              <ActivityIndicator color="#0b0f14" />
            ) : (
              <Text style={s.buttonText}>{tracking ? 'Arrêter le suivi' : 'Démarrer le suivi'}</Text>
            )}
          </Pressable>

          {!!message && <Text style={s.error}>{message}</Text>}

          {(tracking || sentCount > 0) && (
            <View style={s.card}>
              <Text style={s.cardRow}>Positions envoyées : {sentCount}</Text>
              <Text style={s.cardRow}>Échecs : {failCount}</Text>
              {lastSentAt && <Text style={s.cardRow}>Dernier envoi : {lastSentAt.toLocaleTimeString()}</Text>}
              {lastCoords && (
                <Text style={s.cardRow}>
                  Position : {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
                </Text>
              )}
            </View>
          )}

          <Text style={s.hint}>
            Garde l'app ouverte et l'écran allumé pendant le trajet. L'envoi se fait toutes les 5 secondes.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0f14' },
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, paddingTop: 48 },
  brand: { color: '#f5a524', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#9ca3af', fontSize: 15, marginBottom: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  badgeText: { color: '#e5e7eb', fontSize: 15 },
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#151b23',
    borderColor: '#27303b',
    borderWidth: 1,
    borderRadius: 10,
    color: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: { marginTop: 24, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  start: { backgroundColor: '#f5a524' },
  stop: { backgroundColor: '#ef4444' },
  buttonText: { color: '#0b0f14', fontSize: 16, fontWeight: '700' },
  error: { color: '#f87171', marginTop: 16, fontSize: 14 },
  card: {
    backgroundColor: '#151b23',
    borderColor: '#27303b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  cardRow: { color: '#e5e7eb', fontSize: 14, marginBottom: 4 },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 24, lineHeight: 18 },
});
