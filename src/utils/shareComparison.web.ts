import type { RefObject } from 'react';
import type { View } from 'react-native';

// No-op on web — share button is hidden, but the import must resolve cleanly
export async function shareComparison(_ref: RefObject<View>, _dialogTitle: string): Promise<void> {}
