import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import type { Language } from '../i18n/index';

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Efímero — preseleccionar un acero al volver a la lista en modo comparación
  comparePreselect: string | null;
  setComparePreselect: (id: string | null) => void;
  // Sesión de usuario — no se persiste (Supabase maneja los tokens)
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      comparePreselect: null,
      setComparePreselect: (id) => set({ comparePreselect: id }),
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se persiste el idioma; user y comparePreselect son efímeros
      partialize: (state) => ({ language: state.language }),
    }
  )
);
