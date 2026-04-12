import { useEffect } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../hooks/useLanguage';
import { H3, Body, Caption } from './Typography';
import { colors, spacing } from '../../theme';
import type { Language } from '../../i18n/index';

const SIDEBAR_WIDTH = 280;
const ANIMATION_DURATION = 260;

const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: 'en', flag: '🇺🇸', label: 'EN' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
];

interface SidebarItem {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  labelKey: string;
  route: string;
  active?: boolean;
}

const ITEMS: SidebarItem[] = [
  { key: 'gallery',      icon: 'images-outline',   labelKey: 'sidebar.gallery',      route: '/',       active: true },
  { key: 'encyclopedia', icon: 'layers-outline',    labelKey: 'sidebar.encyclopedia', route: '/steels' },
  { key: 'settings',    icon: 'settings-outline',  labelKey: 'sidebar.settings',     route: '/settings' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  currentRoute?: string;
}

export function Sidebar({ open, onClose, currentRoute = '/' }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(open ? 0 : -SIDEBAR_WIDTH, {
      duration: ANIMATION_DURATION,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
    overlayOpacity.value = withTiming(open ? 1 : 0, { duration: ANIMATION_DURATION });
  }, [open]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: (open ? 'auto' : 'none') as any,
  }));

  function navigate(route: string) {
    onClose();
    // Pequeño delay para que la animación de cierre empiece antes de navegar
    setTimeout(() => {
      if (route === '/') {
        router.replace('/' as any);
      } else {
        router.push(route as any);
      }
    }, 120);
  }

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle, { paddingTop: insets.top + spacing.lg }]}>
        {/* Brand */}
        <View style={styles.brand}>
          <H3 style={styles.brandName}>KnifeCompanion</H3>
        </View>

        <View style={styles.divider} />

        {/* Nav items */}
        <View style={styles.nav}>
          {ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <Pressable
                key={item.key}
                onPress={() => navigate(item.route)}
                style={({ pressed }) => [
                  styles.navItem,
                  isActive && styles.navItemActive,
                  pressed && !isActive && styles.navItemPressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isActive ? colors.accent : colors.textSecondary}
                />
                <Body style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {t(item.labelKey)}
                </Body>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Language picker */}
        <View style={styles.langSection}>
          <Caption style={styles.langSectionLabel}>{t('settings.language')}</Caption>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => {
              const isActive = language === lang.value;
              return (
                <Pressable
                  key={lang.value}
                  onPress={() => setLanguage(lang.value)}
                  style={({ pressed }) => [
                    styles.langBtn,
                    isActive && styles.langBtnActive,
                    pressed && !isActive && styles.langBtnPressed,
                  ]}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Caption style={styles.versionText}>KnifeCompanion v1.0</Caption>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  brand: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  brandName: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  nav: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: colors.accentLight,
  },
  navItemPressed: {
    backgroundColor: colors.bg,
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  navLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  langSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  langSectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  langBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  langBtnPressed: {
    backgroundColor: colors.bg,
    opacity: 0.7,
  },
  langFlag: {
    fontSize: 18,
    lineHeight: 22,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langLabelActive: {
    color: colors.accent,
  },
  bottom: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
  },
  versionText: {
    color: colors.border,
    fontSize: 11,
  },
});
