// Node/SSR stub — expo-notifications no corre en Node.js
// Usado por el render estático de Expo durante `expo export --platform web`

export async function registerPushToken(_userId: string): Promise<void> {}
export async function unregisterPushToken(): Promise<void> {}
