import { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption, Label } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import { colors, spacing } from '../src/theme';

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signIn') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        if (!username.trim()) return;
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        // Crear perfil
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: username.trim(),
          });
        }
      }
      router.replace('/');
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError(t('login.errorInvalidCredentials'));
      } else {
        setError(t('login.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Platform.OS === 'web'
          ? `${window.location.origin}/auth/callback`
          : 'com.thebeardydev.knifecompanion://auth/callback',
      });
      if (err) throw err;
      setResetSent(true);
    } catch {
      setError(t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebook() {
    setError(null);
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: Platform.OS === 'web'
            ? `${window.location.origin}/auth/callback`
            : 'com.tbd.knifecompanion://auth/callback',
        },
      });
      if (err) throw err;
      // En web, Supabase redirige automáticamente. En nativo, usaríamos expo-auth-session.
    } catch {
      setError(t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <H1 style={styles.title}>
            {mode === 'signIn' ? t('login.title') : mode === 'signUp' ? t('login.signUpTitle') : t('login.forgotPasswordTitle')}
          </H1>
          <Body style={styles.subtitle}>
            {mode === 'forgotPassword' ? t('login.forgotPasswordSubtitle') : t('login.subtitle')}
          </Body>
        </View>

        {/* Forgot password — success state */}
        {mode === 'forgotPassword' && resetSent ? (
          <View style={styles.resetSuccess}>
            <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
            <H3 style={styles.resetSuccessTitle}>{t('login.resetEmailSent', { email })}</H3>
            <Pressable onPress={() => { setMode('signIn'); setResetSent(false); setEmail(''); }}>
              <Body style={styles.toggleLink}>{t('login.backToSignIn')}</Body>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Form */}
            <View style={styles.form}>
              {mode === 'signUp' && (
                <View style={styles.field}>
                  <Label style={styles.fieldLabel}>{t('login.usernamePlaceholder')}</Label>
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.usernamePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Label style={styles.fieldLabel}>{t('login.emailLabel')}</Label>
                <TextInput
                  style={styles.input}
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {mode !== 'forgotPassword' && (
                <View style={styles.field}>
                  <Label style={styles.fieldLabel}>{t('login.passwordLabel')}</Label>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              )}

              {/* Forgot password link */}
              {mode === 'signIn' && (
                <Pressable
                  onPress={() => { setError(null); setResetSent(false); setMode('forgotPassword'); }}
                  style={styles.forgotLink}
                  hitSlop={8}
                >
                  <Caption style={styles.forgotLinkText}>{t('login.forgotPassword')}</Caption>
                </Pressable>
              )}

              {error && <Caption style={styles.errorText}>{error}</Caption>}

              <Pressable
                onPress={mode === 'forgotPassword' ? handleForgotPassword : handleEmailAuth}
                disabled={loading}
                style={({ pressed }) => [styles.primaryBtn, (pressed || loading) && { opacity: 0.7 }]}
              >
                {loading
                  ? <ActivityIndicator color={colors.surface} />
                  : <Label style={styles.primaryBtnText}>
                      {mode === 'signIn'
                        ? t('login.loginWithEmail')
                        : mode === 'signUp'
                        ? t('login.createAccount')
                        : t('login.sendResetLink')}
                    </Label>
                }
              </Pressable>

              {mode !== 'forgotPassword' && (
                <>
                  {/* Divider */}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Caption style={styles.dividerText}>{t('login.orDivider')}</Caption>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Facebook */}
                  <Pressable
                    onPress={handleFacebook}
                    disabled={loading}
                    style={({ pressed }) => [styles.fbBtn, (pressed || loading) && { opacity: 0.7 }]}
                  >
                    <Ionicons name="logo-facebook" size={20} color="#fff" />
                    <Label style={styles.fbBtnText}>{t('login.loginWithFacebook')}</Label>
                  </Pressable>
                </>
              )}
            </View>

            {/* Toggle mode */}
            <View style={styles.toggleRow}>
              {mode === 'forgotPassword' ? (
                <Pressable onPress={() => { setError(null); setMode('signIn'); }}>
                  <Body style={styles.toggleLink}>{t('login.backToSignIn')}</Body>
                </Pressable>
              ) : (
                <>
                  <Body style={styles.toggleText}>
                    {mode === 'signIn' ? t('login.noAccount') : t('login.alreadyHaveAccount')}
                  </Body>
                  <Pressable onPress={() => { setError(null); setMode(mode === 'signIn' ? 'signUp' : 'signIn'); }}>
                    <Body style={styles.toggleLink}>
                      {mode === 'signIn' ? t('login.signUp') : t('login.signIn')}
                    </Body>
                  </Pressable>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
  },
  fbBtn: {
    backgroundColor: '#1877F2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
  },
  fbBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  forgotLink: { alignSelf: 'flex-end' },
  forgotLinkText: { color: colors.accent, fontSize: 13 },
  resetSuccess: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  resetSuccessTitle: { color: colors.textPrimary, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  toggleLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
