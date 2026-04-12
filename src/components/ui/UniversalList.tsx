import { FlashList, type FlashListProps } from '@shopify/flash-list';

export function UniversalList<T>(props: FlashListProps<T>) {
  return <FlashList {...props} />;
}
