import { Searchbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  return (
    <Searchbar
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={styles.searchbar}
      inputStyle={styles.input}
      elevation={0}
    />
  );
}

const styles = StyleSheet.create({
  searchbar: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  input: {
    fontSize: 15,
    color: colors.textPrimary,
  },
});
