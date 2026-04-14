import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

// Configurar el handler global de notificaciones (solo en nativo)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Pide permisos, obtiene el Expo Push Token y lo guarda en Supabase.
 * Debe llamarse después de que el usuario inicia sesión.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) return; // No funciona en simulador
  if (Platform.OS === 'web') return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  // En Android se requiere un canal
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  const token = tokenData.data;
  if (!token) return;

  // Upsert: un usuario puede tener múltiples dispositivos
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: Platform.OS },
    { onConflict: 'token' }
  );
}

/**
 * Elimina el token del dispositivo actual al cerrar sesión.
 */
export async function unregisterPushToken(): Promise<void> {
  if (!Device.isDevice || Platform.OS === 'web') return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    if (tokenData.data) {
      await supabase.from('push_tokens').delete().eq('token', tokenData.data);
    }
  } catch {
    // Ignorar — el token puede ya no existir
  }
}
