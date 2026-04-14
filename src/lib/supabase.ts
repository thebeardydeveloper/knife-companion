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
    // Durante SSR (static rendering) no existe window/localStorage — devolvemos no-op
    const isBrowser = typeof window !== 'undefined';
    return {
      getItem: (key: string) => isBrowser ? AsyncStorage.getItem(key) : Promise.resolve(null),
      setItem: (key: string, value: string) => isBrowser ? AsyncStorage.setItem(key, value) : Promise.resolve(),
      removeItem: (key: string) => isBrowser ? AsyncStorage.removeItem(key) : Promise.resolve(),
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
  bio: string | null;
  created_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'avatar_url'>;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;          // legacy — primer imagen
  image_urls: string[] | null; // todas las imágenes (nuevo)
  description: string;
  created_at: string;
  fb_post_id: string | null;
  ig_media_id: string | null;
  // Knife metadata (todos opcionales)
  steel_id: string | null;
  steel_name: string | null;
  handle_materials: string[] | null;
  blade_length_mm: number | null;
  blade_width_mm: number | null;
  handle_length_mm: number | null;
  extra_notes: string | null;
  profiles?: Pick<Profile, 'username' | 'avatar_url'>;
}
