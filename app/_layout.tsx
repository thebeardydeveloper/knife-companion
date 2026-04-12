import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paperTheme, colors } from '../src/theme';
import i18n from '../src/i18n';
import { useAppStore } from '../src/store/useAppStore';

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
});

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24,    // 24 horas
      gcTime: 1000 * 60 * 60 * 24 * 7,   // 7 días
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'knifecompanion-query-cache',
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Esperar a que Zustand hidrate desde AsyncStorage y luego sincronizar i18next
    if (useAppStore.persist.hasHydrated()) {
      i18n.changeLanguage(useAppStore.getState().language);
      setReady(true);
      SplashScreen.hideAsync();
    } else {
      const unsub = useAppStore.persist.onFinishHydration((state) => {
        i18n.changeLanguage(state.language);
        setReady(true);
        SplashScreen.hideAsync();
      });
      return unsub;
    }
  }, []);

  if (!ready) return null;

  const stack = (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="steels" />
      <Stack.Screen name="steel/[id]" />
      <Stack.Screen name="compare" />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
      >
        <PaperProvider theme={paperTheme}>
          {Platform.OS === 'web' ? (
            <View style={webStyles.container}>
              <View style={webStyles.inner}>{stack}</View>
            </View>
          ) : stack}
        </PaperProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
