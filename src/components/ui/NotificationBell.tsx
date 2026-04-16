import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Caption } from './Typography';
import { AnnouncementsPanel } from './AnnouncementsPanel';
import { colors } from '../../theme';

interface Props {
  size?: number;
}

export function NotificationBell({ size = 26 }: Props) {
  const [panelOpen, setPanelOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleUnreadChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  return (
    <>
      <Pressable
        onPress={() => setPanelOpen(true)}
        hitSlop={12}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="notifications-outline" size={size} color={colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Caption style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : String(unreadCount)}
            </Caption>
          </View>
        )}
      </Pressable>

      <AnnouncementsPanel
        visible={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUnreadCountChange={handleUnreadChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});
