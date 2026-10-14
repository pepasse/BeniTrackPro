import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { login } from './api';
import { colors } from './theme';

export default function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      onLoggedIn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.brand}>BeniTrackPro</Text>
      <Text style={s.sub}>Suivi de flotte en temps réel</Text>
      <TextInput
        style={s.input} placeholder="Email" placeholderTextColor={colors.muted}
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
      />
      <TextInput
        style={s.input} placeholder="Mot de passe" placeholderTextColor={colors.muted}
        secureTextEntry value={password} onChangeText={setPassword}
      />
      {!!error && <Text style={s.error}>{error}</Text>}
      <Pressable style={[s.btn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Se connecter</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  brand: { color: colors.amber, fontSize: 32, fontWeight: '700' },
  sub: { color: colors.muted, marginBottom: 32, marginTop: 4 },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: 10, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  error: { color: colors.danger, marginBottom: 12 },
  btn: { backgroundColor: colors.amber, borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
});
