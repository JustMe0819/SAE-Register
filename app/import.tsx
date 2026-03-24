import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, FadeInDown, FadeIn, ZoomIn,
} from 'react-native-reanimated';
import { useTheme } from '../constants/theme';
import { parseXLSX, parsePDF } from '../hooks/useFileParser';
import type { SAEGroup } from '../data/saes';

export default function ImportScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [groups, setGroups]     = useState<SAEGroup[]>([]);

  const zoneScale = useSharedValue(1);
  const zoneAnim  = useAnimatedStyle(() => ({ transform: [{ scale: zoneScale.value }] }));

  async function pick() {
    setError(null);
    setGroups([]);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const asset = res.assets[0];
      setFileName(asset.name);
      setLoading(true);

      let parsed: SAEGroup[];
      if (asset.name.match(/\.pdf$/i)) {
        parsed = await parsePDF(asset.uri);
      } else {
        parsed = await parseXLSX(asset.uri);
      }
      setGroups(parsed);
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[s.back, { color: t.textSub }]}>← Retour</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text style={[s.title, { color: t.text }]}>Importer</Text>
          <Text style={[s.sub, { color: t.textSub }]}>
            Fichier <Text style={{ color: t.accent, fontWeight: '800' }}>XLSX</Text> ou{' '}
            <Text style={{ color: t.accent, fontWeight: '800' }}>PDF</Text> — les groupes sont
            détectés automatiquement par note identique.
          </Text>
        </Animated.View>

        {/* Drop zone */}
        <Animated.View
          entering={FadeInDown.delay(120).springify()}
          style={zoneAnim}
        >
          <TouchableOpacity
            style={[s.zone, {
              borderColor: groups.length ? t.accent : t.borderStrong,
              backgroundColor: groups.length ? t.accentBg : t.surface,
            }]}
            onPressIn={() => { zoneScale.value = withSpring(0.97, { damping: 15 }); }}
            onPressOut={() => { zoneScale.value = withSpring(1, { damping: 12 }); }}
            onPress={pick}
            activeOpacity={1}
          >
            <Animated.Text
              key={groups.length > 0 ? 'done' : 'idle'}
              entering={ZoomIn.duration(300)}
              style={s.zoneIcon}
            >
              {groups.length > 0 ? '✅' : '📥'}
            </Animated.Text>
            <Text style={[s.zonePrimary, { color: t.text }]}>
              {fileName ?? 'Appuyer pour choisir un fichier'}
            </Text>
            <Text style={[s.zoneHint, { color: t.textMuted }]}>XLSX · XLS · PDF</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Format guide */}
        <Animated.View
          entering={FadeInDown.delay(180).springify()}
          style={[s.guide, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <Text style={[s.guideTitle, { color: t.textMuted }]}>Formats pris en charge</Text>
          <Text style={[s.guideText, { color: t.textSub }]}>
            {'• Format A : '}
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: t.accent }}>
              Nom | Note
            </Text>
            {'\n• Format B : '}
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: t.accent }}>
              Nom | Prénom | Note
            </Text>
            {'\n• Notes identiques → même groupe détecté automatiquement'}
          </Text>
        </Animated.View>

        {/* Loading */}
        {loading && (
          <Animated.View entering={FadeIn.duration(200)} style={s.loading}>
            <ActivityIndicator color={t.accent} size="large" />
            <Text style={[s.loadingText, { color: t.textSub }]}>Lecture en cours…</Text>
          </Animated.View>
        )}

        {/* Error */}
        {error && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[s.errorBox, { backgroundColor: t.danger + '18', borderColor: t.danger + '55' }]}
          >
            <Text style={[s.errorText, { color: t.danger }]}>⚠️ {error}</Text>
          </Animated.View>
        )}

        {/* Preview */}
        {groups.length > 0 && (
          <Animated.View
            entering={FadeInDown.springify().damping(14)}
            style={[s.preview, { backgroundColor: t.surface, borderColor: t.accent + '66' }]}
          >
            <Text style={[s.previewTitle, { color: t.text }]}>
              {groups.length} groupes détectés
            </Text>
            {groups.slice(0, 8).map((g, i) => (
              <Animated.View
                key={g.id}
                entering={FadeInDown.delay(i * 40).springify()}
                style={[s.previewRow, { borderBottomColor: t.border }]}
              >
                <View style={{ flex: 1 }}>
                  {g.members.map((m) => (
                    <Text key={m} style={[s.memberText, { color: t.text }]}>{m}</Text>
                  ))}
                </View>
                <Text style={[s.previewGrade, {
                  color: g.grade !== null ? t.accent : t.textMuted,
                }]}>
                  {g.grade !== null ? `${g.grade.toFixed(2)}/20` : 'CAN'}
                </Text>
              </Animated.View>
            ))}
            {groups.length > 8 && (
              <Text style={[s.more, { color: t.textMuted }]}>
                +{groups.length - 8} autres groupes…
              </Text>
            )}
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: t.accent }]}
              activeOpacity={0.85}
            >
              <Text style={s.confirmText}>Associer à une SAé →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { padding: 20 },
  back:    { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  title:   { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8 },
  sub:     { fontSize: 14, lineHeight: 21, marginBottom: 24 },
  zone:    { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20,
             padding: 40, alignItems: 'center', gap: 10, marginBottom: 20 },
  zoneIcon:    { fontSize: 40 },
  zonePrimary: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  zoneHint:    { fontSize: 12 },
  guide:   { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, gap: 8 },
  guideTitle:{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  guideText: { fontSize: 13, lineHeight: 22 },
  loading: { alignItems: 'center', padding: 24, gap: 10 },
  loadingText: { fontSize: 13 },
  errorBox:  { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13 },
  preview:   { borderRadius: 18, padding: 16, borderWidth: 1.5, gap: 4 },
  previewTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  previewRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  memberText:   { fontSize: 13, fontWeight: '600' },
  previewGrade: { fontSize: 16, fontWeight: '800' },
  more:         { textAlign: 'center', fontSize: 12, marginTop: 8 },
  confirmBtn:   { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14 },
  confirmText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});