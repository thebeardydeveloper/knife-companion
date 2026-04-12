import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../i18n/index';

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Efímero — preseleccionar un acero al volver a la lista en modo comparación
  comparePreselect: string | null;
  setComparePreselect: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      comparePreselect: null,
      setComparePreselect: (id) => set({ comparePreselect: id }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }), // comparePreselect no se persiste
    }
  )
);
