import AsyncStorage from '@react-native-async-storage/async-storage';

const READ_KEY    = 'kc:announcements:read';
const DISMISS_KEY = 'kc:announcements:dismissed';

async function loadSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

async function saveSet(key: string, set: Set<string>): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify([...set]));
}

// ── Read state ────────────────────────────────────────────────────────────────

export async function getReadIds(): Promise<Set<string>> {
  return loadSet(READ_KEY);
}

export async function markAsRead(id: string): Promise<void> {
  const set = await loadSet(READ_KEY);
  set.add(id);
  await saveSet(READ_KEY, set);
}

export async function markAllAsRead(ids: string[]): Promise<void> {
  const set = await loadSet(READ_KEY);
  ids.forEach((id) => set.add(id));
  await saveSet(READ_KEY, set);
}

// ── Dismiss state ─────────────────────────────────────────────────────────────

export async function getDismissedIds(): Promise<Set<string>> {
  return loadSet(DISMISS_KEY);
}

export async function dismissAnnouncement(id: string): Promise<void> {
  const set = await loadSet(DISMISS_KEY);
  set.add(id);
  await saveSet(DISMISS_KEY, set);
  // Al descartar, también marcar como leído
  await markAsRead(id);
}
