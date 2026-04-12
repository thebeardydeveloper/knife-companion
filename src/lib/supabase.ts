import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// SecureStore tiene un límite de 2048 bytes por entrada.
// Dividimos valores grandes en chunks y los guardamos con sufijo _chunk_N.
const CHUNK_SIZE = 1800;

function makeStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    };
  }

  const SecureStore = require('expo-secure-store');

  return {
    async getItem(key: string): Promise<string | null> {
      // Intentar leer el primer chunk; si existe, reconstruir todos
      const first = await SecureStore.getItemAsync(`${key}_chunk_0`);
      if (first === null) {
        // Fallback: valor guardado sin chunking (sesiones previas)
        return SecureStore.getItemAsync(key);
      }
      const chunks: string[] = [first];
      let i = 1;
      while (true) {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (chunk === null) break;
        chunks.push(chunk);
        i++;
      }
      return chunks.join('');
    },

    async setItem(key: string, value: string): Promise<void> {
      // Borrar valor sin chunking por si existe
      await SecureStore.deleteItemAsync(key).catch(() => {});
      // Escribir en chunks
      const total = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < total; i++) {
        await SecureStore.setItemAsync(
          `${key}_chunk_${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        );
      }
      // Borrar chunks sobrantes de escrituras anteriores más largas
      let j = total;
      while (true) {
        const exists = await SecureStore.getItemAsync(`${key}_chunk_${j}`);
        if (exists === null) break;
        await SecureStore.deleteItemAsync(`${key}_chunk_${j}`);
        j++;
      }
    },

    async removeItem(key: string): Promise<void> {
      await SecureStore.deleteItemAsync(key).catch(() => {});
      let i = 0;
      while (true) {
        const exists = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (exists === null) break;
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        i++;
      }
    },
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: makeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  description: string;
  created_at: string;
  fb_post_id: string | null;
  ig_media_id: string | null;
  profiles?: Pick<Profile, 'username' | 'avatar_url'>;
}
