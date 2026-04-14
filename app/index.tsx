import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Body, Caption, Label } from '../src/components/ui';
import { Sidebar } from '../src/components/ui/Sidebar';
import { ProfileButton } from '../src/components/ui/ProfileButton';
import { useAppStore } from '../src/store/useAppStore';
import { colors, spacing } from '../src/theme';

const headLogo = require('../assets/images/head-logo.png');

// ─── Section accent colors ────────────────────────────────────────────────────

const COLORS = {
  encyclopedia: '#5BB8F5',
  artisans:     '#E8571A',
  suppliers:    '#4CAF7D',
  tutorials:    '#A87FE8',
} as const;

type SectionKey = keyof typeof COLORS;

// Tile fixed dimensions — calculated at render time from screen width
const TILE_COLS = 3;
const TILE_H = 128; // fixed height fits icon(54) + gap(8) + label(32) + padding(32) + 2

// ─── Section + tile definitions ──────────────────────────────────────────────

interface TileDef {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  labelKey: string;
  route?: string;
  comingSoon?: boolean;
}

interface SectionDef {
  key: SectionKey;
  titleKey: string;
  tiles: TileDef[];
}

const SECTIONS: SectionDef[] = [
  {
    key: 'encyclopedia',
    titleKey: 'dashboard.encyclopedia',
    tiles: [
      { icon: 'layers-outline',  labelKey: 'dashboard.steels',  route: '/steels' },
      { icon: 'leaf-outline',    labelKey: 'dashboard.woods',   comingSoon: true },
      { icon: 'flask-outline',   labelKey: 'dashboard.resins',  comingSoon: true },
    ],
  },
  {
    key: 'artisans',
    titleKey: 'dashboard.artisans',
    tiles: [
      { icon: 'images-outline',  labelKey: 'dashboard.latestWork',    route: '/artisans' },
      { icon: 'search-outline',  labelKey: 'dashboard.searchArtisan', route: '/artisans/search' },
    ],
  },
  {
    key: 'suppliers',
    titleKey: 'dashboard.suppliers',
    tiles: [
      { icon: 'storefront-outline', labelKey: 'dashboard.byName',     route: '/suppliers/by-name' },
      { icon: 'construct-outline',  labelKey: 'dashboard.byMaterial', route: '/suppliers/by-material' },
    ],
  },
  {
    key: 'tutorials',
    titleKey: 'dashboard.tutorials',
    tiles: [
      { icon: 'play-circle-outline', labelKey: 'dashboard.comingSoon', comingSoon: true },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const user = useAppStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logoWidth = screenWidth * 0.38;
  const tileW = Math.floor(
    (screenWidth - spacing.md * 2 - spacing.sm * (TILE_COLS - 1)) / TILE_COLS
  );

  function handleProfile() {
    if (!user) router.push('/login' as any);
    else router.push('/profile' as any);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="menu" size={26} color={colors.textPrimary} />
        </Pressable>

        <Image
          source={headLogo}
          style={{ width: logoWidth, height: 34 }}
          resizeMode="contain"
        />

        <View style={styles.headerSpacer} />

        <ProfileButton user={user} size={30} onPress={handleProfile} />
      </View>

      {/* Dashboard */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => {
          const accent = COLORS[section.key];
          const tiles = section.tiles;
          const spacers = Math.max(0, 3 - tiles.length);

          return (
            <View key={section.key} style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionBar, { backgroundColor: accent }]} />
                <Label style={[styles.sectionTitle, { color: accent }]}>
                  {t(section.titleKey)}
                </Label>
              </View>

              {/* Tiles row */}
              <View style={styles.tileRow}>
                {tiles.map((tile) => (
                  <Tile
                    key={tile.labelKey}
                    icon={tile.icon}
                    label={t(tile.labelKey)}
                    accent={accent}
                    comingSoon={tile.comingSoon}
                    size={tileW}
                    onPress={tile.route ? () => router.push(tile.route as any) : undefined}
                  />
                ))}
                {Array.from({ length: spacers }).map((_, i) => (
                  <View key={`sp-${i}`} style={{ width: tileW }} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentRoute="/" />
    </View>
  );
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

interface TileProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  accent: string;
  size: number;
  comingSoon?: boolean;
  onPress?: () => void;
}

function Tile({ icon, label, accent, size, comingSoon, onPress }: TileProps) {
  return (
    <Pressable
      onPress={comingSoon ? undefined : onPress}
      style={({ pressed }) => [
        styles.tile,
        { width: size, height: TILE_H, borderColor: accent + '33' },
        pressed && !comingSoon && { backgroundColor: accent + '12' },
        comingSoon && styles.tileDisabled,
      ]}
    >
      <View style={[styles.tileIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={30} color={accent} />
      </View>
      <Body style={styles.tileLabel} numberOfLines={2}>{label}</Body>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 1.2,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    // width + height set dynamically via size prop
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tileDisabled: {
    opacity: 0.38,
  },
  tileIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textPrimary,
    lineHeight: 16,
    height: 32, // reserve exactly 2 lines — prevents height variance
  },
});
