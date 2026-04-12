import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paperTheme } from '../src/theme';
import i18n from '../src/i18n';
import { useAppStore } from '../src/store/useAppStore';

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

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
      >
        <PaperProvider theme={paperTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="steels" options={{ headerShown: false }} />
            <Stack.Screen name="steel/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
