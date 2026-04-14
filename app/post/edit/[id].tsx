import { useState, type ReactNode } from 'react';
import {
  View, TextInput, StyleSheet, Pressable, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption, Label } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { fetchSteels, type SteelSummary } from '../../../src/api/steels';
import { colors, spacing } from '../../../src/theme';
import type { Post } from '../../../src/lib/supabase';

// ─── Steel picker ─────────────────────────────────────────────────────────────

function SteelPickerModal({ visible, onClose, onSelect }: {
  visible: boolean; onClose: () => void; onSelect: (s: SteelSummary) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data: steels = [] } = useQuery({ queryKey: ['steels'], queryFn: fetchSteels, staleTime: 86400000 });
  const filtered = steels.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[mSt.container, { paddingTop: insets.top }]}>
        <View style={mSt.header}>
          <H3 style={{ color: colors.textPrimary }}>{t('newPost.steelLabel')}</H3>
          <Pressable onPress={onClose} hitSlop={12}><Ionicons name="close" size={24} color={colors.textPrimary} /></Pressable>
        </View>
        <View style={mSt.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput style={mSt.searchInput} placeholder={t('newPost.steelSearch')} placeholderTextColor={colors.textSecondary} value={search} onChangeText={setSearch} autoFocus />
        </View>
        <FlatList data={filtered} keyExtractor={(s) => s.id} keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [mSt.item, pressed && mSt.itemPressed]} onPress={() => { onSelect(item); onClose(); }}>
              <Body style={{ color: colors.textPrimary, fontWeight: '500' }}>{item.name}</Body>
              <Caption style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{item.category}</Caption>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        />
      </View>
    </Modal>
  );
}
const mSt = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  item: { paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.surface },
  itemPressed: { backgroundColor: colors.accentLight },
});

// ─── Material tags ─────────────────────────────────────────────────────────────

function MaterialTags({ tags, onAdd, onRemove, placeholder, addLabel }: {
  tags: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void; placeholder: string; addLabel: string;
}) {
  const [input, setInput] = useState('');
  function add() { const v = input.trim().replace(/,+$/, ''); if (v) { onAdd(v); setInput(''); } }
  return (
    <View style={{ gap: spacing.sm }}>
      {tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {tags.map((tag, i) => (
            <View key={i} style={tSt.tag}>
              <Caption style={tSt.tagText}>{tag}</Caption>
              <Pressable onPress={() => onRemove(i)} hitSlop={6}><Ionicons name="close-circle" size={14} color={colors.accent} /></Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TextInput style={tSt.input} placeholder={placeholder} placeholderTextColor={colors.textSecondary} value={input} onChangeText={setInput} onSubmitEditing={add} returnKeyType="done" />
        <Pressable onPress={add} style={({ pressed }) => [tSt.addBtn, pressed && { opacity: 0.7 }]}><Label style={{ color: colors.surface, fontSize: 13 }}>{addLabel}</Label></Pressable>
      </View>
    </View>
  );
}
const tSt = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentLight, borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.accent },
  tagText: { color: colors.accent, fontSize: 13 },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  addBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Caption style={{ color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm }}>{label}</Caption>;
}
function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return <View style={{ gap: spacing.xs, marginBottom: spacing.md }}><Caption style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Caption>{children}</View>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Post;
    },
    staleTime: 0,
  });

  const [description, setDescription] = useState('');
  const [selectedSteel, setSelectedSteel] = useState<SteelSummary | null>(null);
  const [handleMaterials, setHandleMaterials] = useState<string[]>([]);
  const [bladeLengthMm, setBladeLengthMm] = useState('');
  const [bladeWidthMm, setBladeWidthMm] = useState('');
  const [handleLengthMm, setHandleLengthMm] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [steelPickerVisible, setSteelPickerVisible] = useState(false);

  // Pre-fill once post loads
  if (post && !initialized) {
    setDescription(post.description ?? '');
    setSelectedSteel(post.steel_id ? { id: post.steel_id, name: post.steel_name ?? post.steel_id } as SteelSummary : null);
    setHandleMaterials(post.handle_materials ?? []);
    setBladeLengthMm(post.blade_length_mm?.toString() ?? '');
    setBladeWidthMm(post.blade_width_mm?.toString() ?? '');
    setHandleLengthMm(post.handle_length_mm?.toString() ?? '');
    setExtraNotes(post.extra_notes ?? '');
    setInitialized(true);
  }

  const totalMm = (() => {
    const b = parseFloat(bladeLengthMm), h = parseFloat(handleLengthMm);
    return !isNaN(b) && !isNaN(h) ? b + h : null;
  })();

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('posts').update({
        description: description.trim(),
        steel_id: selectedSteel?.id ?? null,
        steel_name: selectedSteel?.name ?? null,
        handle_materials: handleMaterials.length > 0 ? handleMaterials : null,
        blade_length_mm: bladeLengthMm ? parseFloat(bladeLengthMm) : null,
        blade_width_mm: bladeWidthMm ? parseFloat(bladeWidthMm) : null,
        handle_length_mm: handleLengthMm ? parseFloat(handleLengthMm) : null,
        extra_notes: extraNotes.trim() || null,
      }).eq('id', post.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['post', id] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      router.back();
    } catch (err) {
      console.error('[edit] error:', err);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !initialized) {
    return (
      <View style={[st.screen, { paddingTop: insets.top }]}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <SteelPickerModal visible={steelPickerVisible} onClose={() => setSteelPickerVisible(false)} onSelect={setSelectedSteel} />
      <KeyboardAvoidingView style={st.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[st.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={st.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => [st.iconBtn, pressed && { opacity: 0.6 }]}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <H1 style={st.headerTitle}>{t('post.editTitle')}</H1>
            <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [st.saveBtn, pressed && { opacity: 0.7 }]}>
              {saving ? <ActivityIndicator size="small" color={colors.surface} /> : <Label style={st.saveBtnText}>{t('post.saveChanges')}</Label>}
            </Pressable>
          </View>

          {/* Images note */}
          <View style={st.imagesNote}>
            <Ionicons name="images-outline" size={16} color={colors.textSecondary} />
            <Caption style={st.imagesNoteText}>{t('post.imagesNote')}</Caption>
          </View>

          {/* Description */}
          <View style={st.section}>
            <TextInput style={st.descriptionInput} placeholder={t('newPost.descriptionPlaceholder')} placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
          </View>

          {/* Details */}
          <View style={st.detailsCard}>
            <SectionLabel label={t('newPost.knifeDetails')} />

            <FieldRow label={t('newPost.steelLabel')}>
              <Pressable onPress={() => setSteelPickerVisible(true)} style={({ pressed }) => [st.steelSelector, pressed && { opacity: 0.7 }]}>
                <Body style={selectedSteel ? st.steelSelected : st.steelPlaceholder}>{selectedSteel?.name ?? t('newPost.steelPlaceholder')}</Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {selectedSteel && <Pressable onPress={() => setSelectedSteel(null)} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textSecondary} /></Pressable>}
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>
            </FieldRow>

            <FieldRow label={t('newPost.handleMaterials')}>
              <MaterialTags tags={handleMaterials} onAdd={(v) => setHandleMaterials((p) => [...p, v])} onRemove={(i) => setHandleMaterials((p) => p.filter((_, idx) => idx !== i))} placeholder={t('newPost.handleMaterialsPlaceholder')} addLabel={t('newPost.addMaterial')} />
            </FieldRow>

            <FieldRow label={t('newPost.bladeLengthMm')}>
              <TextInput style={st.measureInput} placeholder="0" placeholderTextColor={colors.textSecondary} value={bladeLengthMm} onChangeText={setBladeLengthMm} keyboardType="numeric" />
            </FieldRow>
            <FieldRow label={t('newPost.bladeWidthMm')}>
              <TextInput style={st.measureInput} placeholder="0" placeholderTextColor={colors.textSecondary} value={bladeWidthMm} onChangeText={setBladeWidthMm} keyboardType="numeric" />
            </FieldRow>
            <FieldRow label={t('newPost.handleLengthMm')}>
              <TextInput style={st.measureInput} placeholder="0" placeholderTextColor={colors.textSecondary} value={handleLengthMm} onChangeText={setHandleLengthMm} keyboardType="numeric" />
            </FieldRow>
            {totalMm !== null && (
              <View style={st.totalRow}>
                <Caption style={st.totalLabel}>{t('newPost.totalLength')}</Caption>
                <Body style={st.totalValue}>{totalMm} mm</Body>
              </View>
            )}

            <FieldRow label={t('newPost.extraNotes')}>
              <TextInput style={[st.measureInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder={t('newPost.extraNotesPlaceholder')} placeholderTextColor={colors.textSecondary} value={extraNotes} onChangeText={setExtraNotes} multiline numberOfLines={3} />
            </FieldRow>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  headerTitle: { flex: 1, fontSize: 18 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minWidth: 80, alignItems: 'center', minHeight: 34, justifyContent: 'center' },
  saveBtnText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  imagesNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.accentLight, borderBottomWidth: 1, borderColor: colors.accent },
  imagesNoteText: { color: colors.accent, fontSize: 12, flex: 1 },
  section: { paddingHorizontal: spacing.md },
  descriptionInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.textPrimary, minHeight: 90 },
  detailsCard: { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  steelSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 10 },
  steelSelected: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  steelPlaceholder: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  measureInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: spacing.md },
  totalLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  totalValue: { color: colors.accent, fontWeight: '700' },
});
