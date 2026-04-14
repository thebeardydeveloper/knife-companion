import { Pressable, Image, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
  size?: number;
  onPress: () => void;
}

export function ProfileButton({ user, size = 30, onPress }: Props) {
  const { data: avatarUrl } = useQuery<string | null>({
    queryKey: ['my-avatar', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      return data?.avatar_url ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const radius = size / 2;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: radius },
          ]}
        />
      ) : (
        <Ionicons
          name={user ? 'person-circle' : 'person-circle-outline'}
          size={size}
          color={user ? colors.accent : colors.textSecondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
});
