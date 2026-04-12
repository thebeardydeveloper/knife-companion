import { Text, type TextProps } from 'react-native';
import { typography } from '../../theme';

export function H1({ style, ...props }: TextProps) {
  return <Text style={[typography.h1, style]} {...props} />;
}

export function H2({ style, ...props }: TextProps) {
  return <Text style={[typography.h2, style]} {...props} />;
}

export function H3({ style, ...props }: TextProps) {
  return <Text style={[typography.h3, style]} {...props} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text style={[typography.body, style]} {...props} />;
}

export function Caption({ style, ...props }: TextProps) {
  return <Text style={[typography.caption, style]} {...props} />;
}

export function Label({ style, ...props }: TextProps) {
  return <Text style={[typography.label, style]} {...props} />;
}
