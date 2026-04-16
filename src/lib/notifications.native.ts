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
  try {
    if (!Device.isDevice) {
      console.log('[PushToken] Skipped: not a physical device');
      return;
    }
    if (Platform.OS === 'web') return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    console.log('[PushToken] Permission status:', existing);

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[PushToken] Permission after request:', status);
    }

    if (finalStatus !== 'granted') {
      console.log('[PushToken] Permission denied, aborting');
      return;
    }

    // En Android se requiere un canal
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    console.log('[PushToken] Using projectId:', projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[PushToken] Token obtained:', token);

    if (!token) {
      console.warn('[PushToken] No token returned');
      return;
    }

    // Upsert: un usuario puede tener múltiples dispositivos
    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS },
      { onConflict: 'token' }
    );

    if (error) {
      console.error('[PushToken] Supabase upsert error:', error.message);
    } else {
      console.log('[PushToken] Token saved successfully for user', userId);
    }
  } catch (err) {
    console.error('[PushToken] Unexpected error:', err);
  }
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
