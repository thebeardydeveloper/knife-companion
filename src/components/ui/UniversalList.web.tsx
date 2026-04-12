import { FlatList, type FlatListProps } from 'react-native';

type Props<T> = FlatListProps<T> & { estimatedItemSize?: number };

export function UniversalList<T>({ estimatedItemSize: _ignored, ...props }: Props<T>) {
  return <FlatList {...props} />;
}
