import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption } from '../src/components/ui';
import { colors, spacing } from '../src/theme';

interface SectionProps {
  title: string;
  children: string;
}
function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <H3 style={styles.sectionTitle}>{title}</H3>
      <Body style={styles.sectionBody}>{children}</Body>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <H1 style={styles.headerTitle}>{t('settings.privacyPolicy')}</H1>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Caption style={styles.lastUpdated}>Last updated: April 2026</Caption>

        <Section title="Who we are">
          {`KnifeCompanion is a mobile app and community for knife makers and enthusiasts. It allows users to share their work, discover knife-making techniques, and explore a steel reference encyclopedia.\n\nDeveloped by thebeardydev. Contact: privacy@thebeardydev.com`}
        </Section>

        <Section title="Information we collect">
          {`When you create an account we collect:\n• Email address (required for authentication)\n• Username (chosen by you)\n• Profile photo (optional)\n• Bio text (optional)\n\nWhen you post content we store:\n• Photos you upload\n• Descriptions, knife metadata (steel, dimensions, materials), and notes you provide\n• Timestamp and your user ID`}
        </Section>

        <Section title="How we use your information">
          {`We use the information you provide solely to:\n• Display your profile and posts to other users\n• Authenticate your account securely\n• Send push notifications about activity on your posts (likes and comments), if you grant permission\n\nWe do not sell, rent, or share your personal information with third parties for marketing purposes.`}
        </Section>

        <Section title="Third-party services">
          {`We use the following services to operate the app:\n\n• Supabase — authentication, database, and file storage (supabase.com)\n• Expo — mobile app delivery and push notification infrastructure (expo.dev)\n• Facebook — optional OAuth login (facebook.com)\n\nEach service has its own privacy policy. We encourage you to review them.`}
        </Section>

        <Section title="Push notifications">
          {`If you grant permission, we store your device's push token to deliver notifications when someone likes or comments on your posts. You can revoke this permission at any time from your device settings. Your push token is deleted from our servers when you sign out of the app.`}
        </Section>

        <Section title="Data retention and deletion">
          {`Your account and all associated content (posts, comments, likes) are retained while your account is active.\n\nTo request deletion of your account and all associated data, please email us at privacy@thebeardydev.com. We will process your request within 30 days.`}
        </Section>

        <Section title="Children's privacy">
          {`KnifeCompanion is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us.`}
        </Section>

        <Section title="Changes to this policy">
          {`We may update this Privacy Policy from time to time. We will notify you of significant changes via a notice in the app. Continued use of the app after changes constitutes acceptance of the updated policy.`}
        </Section>

        <Section title="Contact">
          {`If you have any questions about this Privacy Policy, please contact us at:\nprivacy@thebeardydev.com`}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  lastUpdated: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
