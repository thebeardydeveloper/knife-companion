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
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useQueryClient } from '@tanstack/react-query';
import { H1, Body, Caption, Label } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/store/useAppStore';
import { colors, spacing } from '../src/theme';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function NewPostScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [publishFacebook, setPublishFacebook] = useState(false);
  const [publishInstagram, setPublishInstagram] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handlePublish() {
    if (!imageUri) {
      setError(t('newPost.errorNoImage'));
      return;
    }
    if (!user) {
      router.push('/login' as any);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // 1. Upload image to Supabase Storage
      const ext = (imageUri.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `${user.id}/${generateId()}.${ext}`;

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, decode(base64), { contentType: mimeType });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // 3. Insert post record
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: imageUrl,
        description: description.trim(),
      });
      if (insertError) throw insertError;

      // Invalidar el feed para que se recargue con el nuevo post
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });

      router.replace('/');
    } catch (err) {
      console.error('[publish] error:', err);
      setError(t('newPost.errorUpload'));
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <H1 style={styles.headerTitle}>{t('newPost.title')}</H1>
          <Pressable
            onPress={handlePublish}
            disabled={loading || !imageUri}
            style={({ pressed }) => [
              styles.publishBtn,
              (!imageUri || loading) && styles.publishBtnDisabled,
              pressed && { opacity: 0.7 },
            ]}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.surface} />
              : <Label style={styles.publishBtnText}>{t('newPost.publish')}</Label>
            }
          </Pressable>
        </View>

        {/* Image picker */}
        <Pressable
          onPress={pickImage}
          style={({ pressed }) => [styles.imagePicker, imageUri && styles.imagePickerFilled, pressed && { opacity: 0.8 }]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePickerContent}>
              <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              <Body style={styles.imagePickerText}>{t('newPost.pickPhoto')}</Body>
            </View>
          )}
        </Pressable>

        {/* Camera button */}
        {Platform.OS !== 'web' && !imageUri && (
          <Pressable
            onPress={takePhoto}
            style={({ pressed }) => [styles.cameraBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="camera-outline" size={18} color={colors.accent} />
            <Label style={styles.cameraBtnText}>{t('newPost.takePhoto')}</Label>
          </Pressable>
        )}

        {/* Description */}
        <TextInput
          style={styles.descriptionInput}
          placeholder={t('newPost.descriptionPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {error && <Caption style={styles.errorText}>{error}</Caption>}

        {/* Cross-posting toggles — only native, pending Meta App Review */}
        {Platform.OS !== 'web' && (
          <View style={styles.crossPostSection}>
            <Caption style={styles.crossPostLabel}>{t('newPost.publishTo')}</Caption>

            <View style={styles.toggle}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              <Body style={styles.toggleLabel}>{t('newPost.facebook')}</Body>
              <Switch
                value={publishFacebook}
                onValueChange={setPublishFacebook}
                trackColor={{ true: colors.accent }}
              />
            </View>

            <View style={[styles.toggle, styles.toggleLast]}>
              <Ionicons name="logo-instagram" size={20} color="#C13584" />
              <Body style={styles.toggleLabel}>{t('newPost.instagram')}</Body>
              <Switch
                value={publishInstagram}
                onValueChange={setPublishInstagram}
                trackColor={{ true: colors.accent }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    gap: spacing.md,
  },
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 80,
    alignItems: 'center',
    minHeight: 34,
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    backgroundColor: colors.border,
  },
  publishBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  imagePicker: {
    marginHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePickerFilled: {
    borderStyle: 'solid',
    borderColor: colors.border,
  },
  imagePickerContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  imagePickerText: {
    color: colors.textSecondary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  cameraBtnText: {
    color: colors.accent,
    fontSize: 13,
  },
  descriptionInput: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 100,
  },
  errorText: {
    color: '#c0392b',
    marginHorizontal: spacing.md,
    fontSize: 13,
  },
  crossPostSection: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  crossPostLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleLast: {},
  toggleLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
});
