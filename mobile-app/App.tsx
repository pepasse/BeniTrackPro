import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { clearSession, hasSession } from './src/api';
import LoginScreen from './src/LoginScreen';
import VehiclesScreen from './src/VehiclesScreen';
import { colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    hasSession().then((ok) => {
      setLoggedIn(ok);
      setReady(true);
    });
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setLoggedIn(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />
      {!ready ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={colors.amber} />
        </View>
      ) : loggedIn ? (
        <VehiclesScreen onLogout={logout} />
      ) : (
        <LoginScreen onLoggedIn={() => setLoggedIn(true)} />
      )}
    </View>
  );
}
