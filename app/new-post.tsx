import { useState, type ReactNode } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { H1, H3, Body, Caption, Label } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/store/useAppStore';
import { fetchSteels, type SteelSummary } from '../src/api/steels';
import { colors, spacing } from '../src/theme';

const MAX_IMAGES = 8;

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Steel picker modal ───────────────────────────────────────────────────────

interface SteelPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (steel: SteelSummary) => void;
}

function SteelPickerModal({ visible, onClose, onSelect }: SteelPickerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const { data: steels = [] } = useQuery({
    queryKey: ['steels'],
    queryFn: () => fetchSteels(),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const filtered = steels.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modalSt.container, { paddingTop: insets.top }]}>
        <View style={modalSt.header}>
          <H3 style={modalSt.headerTitle}>{t('newPost.steelLabel')}</H3>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={modalSt.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={modalSt.searchInput}
            placeholder={t('newPost.steelSearch')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [modalSt.item, pressed && modalSt.itemPressed]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Body style={modalSt.itemName}>{item.name}</Body>
              <Caption style={modalSt.itemCategory}>{item.category}</Caption>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={modalSt.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        />
      </View>
    </Modal>
  );
}

const modalSt = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { color: colors.textPrimary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  itemPressed: { backgroundColor: colors.accentLight },
  itemName: { color: colors.textPrimary, fontWeight: '500' },
  itemCategory: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border },
});

// ─── Material tag input ───────────────────────────────────────────────────────

interface MaterialTagsProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  addLabel: string;
}

function MaterialTags({ tags, onAdd, onRemove, placeholder, addLabel }: MaterialTagsProps) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim().replace(/,+$/, '');
    if (trimmed) { onAdd(trimmed); setInput(''); }
  }

  return (
    <View style={tagSt.wrapper}>
      {tags.length > 0 && (
        <View style={tagSt.tagRow}>
          {tags.map((tag, i) => (
            <View key={i} style={tagSt.tag}>
              <Caption style={tagSt.tagText}>{tag}</Caption>
              <Pressable onPress={() => onRemove(i)} hitSlop={6}>
                <Ionicons name="close-circle" size={14} color={colors.accent} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={tagSt.inputRow}>
        <TextInput
          style={tagSt.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Pressable
          onPress={add}
          style={({ pressed }) => [tagSt.addBtn, pressed && { opacity: 0.7 }]}
        >
          <Label style={tagSt.addBtnText}>{addLabel}</Label>
        </Pressable>
      </View>
    </View>
  );
}

const tagSt = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLight,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tagText: { color: colors.accent, fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: colors.surface, fontSize: 13 },
});

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function NewPostScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [selectedSteel, setSelectedSteel] = useState<SteelSummary | null>(null);
  const [handleMaterials, setHandleMaterials] = useState<string[]>([]);
  const [bladeLengthMm, setBladeLengthMm] = useState('');
  const [bladeWidthMm, setBladeWidthMm] = useState('');
  const [handleLengthMm, setHandleLengthMm] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [publishFacebook, setPublishFacebook] = useState(false);
  const [publishInstagram, setPublishInstagram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steelPickerVisible, setSteelPickerVisible] = useState(false);

  const totalMm = (() => {
    const blade = parseFloat(bladeLengthMm);
    const handle = parseFloat(handleLengthMm);
    if (!isNaN(blade) && !isNaN(handle)) return blade + handle;
    return null;
  })();

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImage(uri: string, userId: string): Promise<string> {
    const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const fileName = `${userId}/${generateId()}.${ext}`;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const { error } = await supabase.storage
      .from('posts')
      .upload(fileName, decode(base64), { contentType: mimeType });
    if (error) throw error;
    const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handlePublish() {
    if (images.length === 0) { setError(t('newPost.errorNoImage')); return; }
    if (!user) { router.push('/login' as any); return; }
    setError(null);
    setLoading(true);
    try {
      // Subir todas las imágenes
      const imageUrls = await Promise.all(images.map((uri) => uploadImage(uri, user.id)));

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: imageUrls[0],
        image_urls: imageUrls,
        description: description.trim(),
        steel_id: selectedSteel?.id ?? null,
        steel_name: selectedSteel?.name ?? null,
        handle_materials: handleMaterials.length > 0 ? handleMaterials : null,
        blade_length_mm: bladeLengthMm ? parseFloat(bladeLengthMm) : null,
        blade_width_mm: bladeWidthMm ? parseFloat(bladeWidthMm) : null,
        handle_length_mm: handleLengthMm ? parseFloat(handleLengthMm) : null,
        extra_notes: extraNotes.trim() || null,
      });
      if (insertError) throw insertError;

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
    <>
      <SteelPickerModal
        visible={steelPickerVisible}
        onClose={() => setSteelPickerVisible(false)}
        onSelect={setSelectedSteel}
      />

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
            <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <H1 style={styles.headerTitle}>{t('newPost.title')}</H1>
            <Pressable
              onPress={handlePublish}
              disabled={loading || images.length === 0}
              style={({ pressed }) => [styles.publishBtn, (images.length === 0 || loading) && styles.publishBtnDisabled, pressed && { opacity: 0.7 }]}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.surface} />
                : <Label style={styles.publishBtnText}>{t('newPost.publish')}</Label>
              }
            </Pressable>
          </View>

          {/* ── Fotos ── */}
          <View style={styles.section}>
            <SectionLabel label={t('newPost.photosLabel')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {images.map((uri, i) => (
                <View key={uri} style={styles.imageThumbnailWrapper}>
                  <Image source={{ uri }} style={styles.imageThumbnail} />
                  {i === 0 && (
                    <View style={styles.primaryBadge}>
                      <Caption style={styles.primaryBadgeText}>1</Caption>
                    </View>
                  )}
                  <Pressable style={styles.removeImageBtn} onPress={() => removeImage(i)} hitSlop={4}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <View style={styles.addImageButtons}>
                  <Pressable onPress={pickImages} style={({ pressed }) => [styles.addImageBtn, pressed && { opacity: 0.7 }]}>
                    <Ionicons name="images-outline" size={26} color={colors.accent} />
                    <Caption style={styles.addImageLabel}>{t('newPost.pickPhoto')}</Caption>
                  </Pressable>
                  {Platform.OS !== 'web' && (
                    <Pressable onPress={takePhoto} style={({ pressed }) => [styles.addImageBtn, pressed && { opacity: 0.7 }]}>
                      <Ionicons name="camera-outline" size={26} color={colors.accent} />
                      <Caption style={styles.addImageLabel}>{t('newPost.takePhoto')}</Caption>
                    </Pressable>
                  )}
                </View>
              )}
            </ScrollView>
          </View>

          {/* ── Descripción ── */}
          <View style={styles.section}>
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
          </View>

          {/* ── Detalles del cuchillo ── */}
          <View style={styles.detailsCard}>
            <SectionLabel label={t('newPost.knifeDetails')} />

            {/* Acero */}
            <FieldRow label={t('newPost.steelLabel')}>
              <Pressable
                onPress={() => setSteelPickerVisible(true)}
                style={({ pressed }) => [styles.steelSelector, pressed && { opacity: 0.7 }]}
              >
                <Body style={selectedSteel ? styles.steelSelected : styles.steelPlaceholder}>
                  {selectedSteel?.name ?? t('newPost.steelPlaceholder')}
                </Body>
                <View style={styles.steelSelectorRight}>
                  {selectedSteel && (
                    <Pressable onPress={() => setSelectedSteel(null)} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                    </Pressable>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>
            </FieldRow>

            {/* Materiales del cabo */}
            <FieldRow label={t('newPost.handleMaterials')}>
              <MaterialTags
                tags={handleMaterials}
                onAdd={(t) => setHandleMaterials((prev) => [...prev, t])}
                onRemove={(i) => setHandleMaterials((prev) => prev.filter((_, idx) => idx !== i))}
                placeholder={t('newPost.handleMaterialsPlaceholder')}
                addLabel={t('newPost.addMaterial')}
              />
            </FieldRow>

            {/* Medidas */}
            <FieldRow label={t('newPost.bladeLengthMm')}>
              <TextInput
                style={styles.measureInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={bladeLengthMm}
                onChangeText={setBladeLengthMm}
                keyboardType="numeric"
              />
            </FieldRow>
            <FieldRow label={t('newPost.bladeWidthMm')}>
              <TextInput
                style={styles.measureInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={bladeWidthMm}
                onChangeText={setBladeWidthMm}
                keyboardType="numeric"
              />
            </FieldRow>
            <FieldRow label={t('newPost.handleLengthMm')}>
              <TextInput
                style={styles.measureInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={handleLengthMm}
                onChangeText={setHandleLengthMm}
                keyboardType="numeric"
              />
            </FieldRow>
            {totalMm !== null && (
              <View style={styles.totalRow}>
                <Caption style={styles.totalLabel}>{t('newPost.totalLength')}</Caption>
                <Body style={styles.totalValue}>{totalMm} mm</Body>
              </View>
            )}

            {/* Notas extra */}
            <FieldRow label={t('newPost.extraNotes')}>
              <TextInput
                style={[styles.measureInput, styles.notesInput]}
                placeholder={t('newPost.extraNotesPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={extraNotes}
                onChangeText={setExtraNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </FieldRow>
          </View>

          {error && <Caption style={styles.errorText}>{error}</Caption>}

          {/* Cross-posting */}
          {Platform.OS !== 'web' && (
            <View style={styles.crossPostSection}>
              <Caption style={styles.crossPostLabel}>{t('newPost.publishTo')}</Caption>
              <View style={styles.toggle}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Body style={styles.toggleLabel}>{t('newPost.facebook')}</Body>
                <Switch value={publishFacebook} onValueChange={setPublishFacebook} trackColor={{ true: colors.accent }} />
              </View>
              <View style={[styles.toggle]}>
                <Ionicons name="logo-instagram" size={20} color="#C13584" />
                <Body style={styles.toggleLabel}>{t('newPost.instagram')}</Body>
                <Switch value={publishInstagram} onValueChange={setPublishInstagram} trackColor={{ true: colors.accent }} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Caption style={secSt.label}>{label}</Caption>;
}
function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={secSt.fieldRow}>
      <Caption style={secSt.fieldLabel}>{label}</Caption>
      {children}
    </View>
  );
}
const secSt = StyleSheet.create({
  label: { color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  fieldRow: { gap: spacing.xs, marginBottom: spacing.md },
  fieldLabel: { color: colors.textSecondary, fontSize: 12 },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { gap: spacing.md },
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
  headerTitle: { flex: 1, fontSize: 18 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
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
  publishBtnDisabled: { backgroundColor: colors.border },
  publishBtnText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: spacing.md },
  imageRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  imageThumbnailWrapper: { position: 'relative', width: 100, height: 100 },
  imageThumbnail: { width: 100, height: 100, borderRadius: 8, backgroundColor: colors.bg },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  removeImageBtn: { position: 'absolute', top: 4, right: 4 },
  addImageButtons: { flexDirection: 'row', gap: spacing.sm },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.accentLight,
  },
  addImageLabel: { color: colors.accent, fontSize: 11, textAlign: 'center' },
  descriptionInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 90,
  },
  detailsCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  steelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  steelSelected: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  steelPlaceholder: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  steelSelectorRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  measureInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.md,
  },
  totalLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  totalValue: { color: colors.accent, fontWeight: '700' },
  errorText: { color: '#c0392b', marginHorizontal: spacing.md, fontSize: 13 },
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
  toggleLabel: { flex: 1, color: colors.textPrimary, fontSize: 15 },
});
