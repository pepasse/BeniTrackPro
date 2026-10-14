import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export interface GeofenceAlert {
  toastId: string;
  vehiclePlate: string;
  geofenceName: string;
  eventType: 'enter' | 'exit';
  occurredAt: string;
}

export default function AlertBanners({
  alerts,
  onDismiss,
}: {
  alerts: GeofenceAlert[];
  onDismiss: (id: string) => void;
}) {
  if (!alerts.length) return null;
  return (
    <View style={s.stack} pointerEvents="box-none">
      {alerts.map((a) => {
        const enter = a.eventType === 'enter';
        return (
          <Pressable
            key={a.toastId}
            onPress={() => onDismiss(a.toastId)}
            style={[s.card, { borderColor: enter ? colors.signal : colors.amber }]}
          >
            <Text style={s.text}>
              <Text style={s.plate}>{a.vehiclePlate}</Text>{' '}
              {enter ? 'est entré dans' : 'a quitté'} <Text style={s.bold}>{a.geofenceName}</Text>
            </Text>
            <Text style={s.time}>{new Date(a.occurredAt).toLocaleTimeString('fr-FR')} · touche pour fermer</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  stack: { position: 'absolute', top: 96, left: 12, right: 12, zIndex: 50, gap: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  text: { color: colors.text, fontSize: 14 },
  plate: { fontWeight: '700' },
  bold: { fontWeight: '600' },
  time: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
