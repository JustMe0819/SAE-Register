import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API, API_BASE } from '../../constants/api';
import { DOMAIN_META, useTheme } from '../../constants/theme';
import type { SaeDTO } from '../../constants/types';

function gradeColor(g: number | null, t: ReturnType<typeof useTheme>): string {
  if (g === null) return t.textMuted;
  if (g >= 16) return t.success;
  if (g >= 12) return t.accent;
  if (g >= 10) return t.warning;
  return t.danger;
}

function GradeBar({ grade, t }: { grade: number | null; t: ReturnType<typeof useTheme> }) {
  const width = useSharedValue(0);
  const pct   = grade !== null ? (grade / 20) * 100 : 0;
  const color = gradeColor(grade, t);
  const anim  = useAnimatedStyle(() => ({ width: `${width.value}%` as any, backgroundColor: color }));
  useEffect(() => { width.value = withSpring(pct, { damping: 14, stiffness: 80 }); }, []);
  return (
    <View style={[gb.track, { backgroundColor: t.surfaceHigh }]}>
      <Animated.View style={[gb.fill, anim]} />
    </View>
  );
}
const gb = StyleSheet.create({
  track: { height: 4, borderRadius: 2, overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', borderRadius: 2 },
});

export default function SAEDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [sae, setSae]     = useState<SaeDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour l'édition des URLs
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [editSiteUrl, setEditSiteUrl] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');

  const scrollY  = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
  const heroAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.6]),
    transform: [{ translateY: interpolate(scrollY.value, [0, 100], [0, -20]) }],
  }));

  useEffect(() => {
    fetch(API.saeById(Number(id)))
      .then(r => r.json())
      .then(setSae)
      .catch(() => setError('Impossible de charger cette SAé.'));
  }, [id]);

  // Fonctions pour l'édition des URLs
  const startEditing = (student: any) => {
    setEditingStudent(student.id);
    setEditSiteUrl(student.siteUrl || '');
    setEditRepoUrl(student.repoUrl || '');
  };

  const saveUrls = async (studentId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/saes/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: editSiteUrl, repoUrl: editRepoUrl }),
      });
      if (response.ok) {
        // Recharger les données
        const updatedSae = await fetch(API.saeById(Number(id))).then(r => r.json());
        setSae(updatedSae);
        setEditingStudent(null);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      alert('Erreur réseau');
    }
  };

  const cancelEditing = () => {
    setEditingStudent(null);
    setEditSiteUrl('');
    setEditRepoUrl('');
  };

  if (error) return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <Text style={[s.notFound, { color: t.textMuted }]}>{error}</Text>
    </View>
  );
  if (!sae) return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <Text style={[s.notFound, { color: t.textMuted }]}>Chargement…</Text>
    </View>
  );

  const meta   = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
  const sorted = [...sae.students].sort((a, b) => (b.grade ?? -1) - (a.grade ?? -1));

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={[s.backText, { color: t.textSub }]}>← Retour</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Hero */}
        <Animated.View style={[s.hero, heroAnim, { backgroundColor: t.surface, borderColor: t.border }]}>
          {sae.illustration && (
            <Image source={{ uri: API_BASE + sae.illustration }} style={s.heroImage} />
          )}
          <View style={[s.domTag, { backgroundColor: meta.color + '22' }]}>
            <Text style={[s.domText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
          </View>
          <Text style={[s.code, { color: t.textSub }]}>{sae.code}</Text>
          <Text style={[s.heroName, { color: t.text }]}>{sae.name}</Text>
          <Text style={[s.heroBadge, { color: t.textSub }]}>
            {sae.year} · Semestre {sae.semester} · {sae.ue}
          </Text>

          {/* Dates */}
          {(sae.dateDebut || sae.dateFin) && (
            <Text style={[s.meta, { color: t.textSub }]}>
              📅 {sae.dateDebut ?? '?'} → {sae.dateFin ?? '?'}
            </Text>
          )}

          {/* Description */}
          {sae.description && (
            <Text style={[s.desc, { color: t.textSub }]}>{sae.description}</Text>
          )}

          {/* Compétences */}
          {sae.competences && (
            <View style={[s.infoBox, { backgroundColor: t.surfaceHigh }]}>
              <Text style={[s.infoLabel, { color: t.textMuted }]}>COMPÉTENCES</Text>
              <Text style={[s.infoValue, { color: t.text }]}>{sae.competences}</Text>
            </View>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={s.statsRow}>
            {[
              { v: String(sae.stats.total),              l: 'étudiants' },
              { v: String(sae.stats.graded),             l: 'notés' },
              { v: sae.stats.avg?.toFixed(2) ?? '–',     l: 'moyenne', accent: true },
              { v: sae.stats.max?.toFixed(2) ?? '–',     l: 'max' },
              { v: sae.stats.min?.toFixed(2) ?? '–',     l: 'min' },
              { v: sae.tauxReussite !== null ? `${sae.tauxReussite?.toFixed(1)}%` : '–', l: 'réussite' },
            ].map(item => (
              <View key={item.l} style={[s.statBox, {
                backgroundColor: t.surface,
                borderColor: item.accent ? t.accent : t.border,
              }]}>
                <Text style={[s.statVal, { color: item.accent ? t.accent : t.text }]}>{item.v}</Text>
                <Text style={[s.statLbl, { color: t.textMuted }]}>{item.l}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Étudiants */}
        <Text style={[s.section, { color: t.text }]}>Étudiants</Text>
        {sorted.map((student, i) => (
          <Animated.View key={student.id} entering={FadeInDown.delay(150 + i * 50).springify().damping(14)}>
            <View style={[s.groupCard, { backgroundColor: t.surface, borderColor: t.border }]}>

              {/* Mode édition */}
              {editingStudent === student.id ? (
                <View style={s.editContainer}>
                  <Text style={[s.editTitle, { color: t.text }]}>Modifier les URLs pour {student.fullName}</Text>

                  <Text style={[s.editLabel, { color: t.textMuted }]}>Site web</Text>
                  <TextInput
                    style={[s.editInput, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
                    value={editSiteUrl}
                    onChangeText={setEditSiteUrl}
                    placeholder="https://monsite.com"
                    placeholderTextColor={t.textMuted}
                  />

                  <Text style={[s.editLabel, { color: t.textMuted }]}>Repository</Text>
                  <TextInput
                    style={[s.editInput, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
                    value={editRepoUrl}
                    onChangeText={setEditRepoUrl}
                    placeholder="https://github.com/user/repo"
                    placeholderTextColor={t.textMuted}
                  />

                  <View style={s.editButtons}>
                    <TouchableOpacity
                      style={[s.editBtn, s.editBtnCancel, { borderColor: t.border }]}
                      onPress={cancelEditing}
                    >
                      <Text style={[s.editBtnText, { color: t.textMuted }]}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.editBtn, s.editBtnSave, { backgroundColor: t.accent }]}
                      onPress={() => saveUrls(student.id)}
                    >
                      <Text style={[s.editBtnText, { color: t.text }]}>💾 Sauvegarder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Mode affichage normal */
                <>
                  <View style={s.groupLeft}>
                    <Text style={[s.groupRank, { color: t.textMuted }]}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.memberName, { color: t.text }]}>{student.fullName}</Text>
                      {student.siteUrl && (
                        <TouchableOpacity onPress={() => Linking.openURL(student.siteUrl!)}>
                          <Text style={[s.urlText, { color: t.accent }]}>🌐 {student.siteUrl}</Text>
                        </TouchableOpacity>
                      )}
                      {student.repoUrl && (
                        <TouchableOpacity onPress={() => Linking.openURL(student.repoUrl!)}>
                          <Text style={[s.urlText, { color: t.accent }]}>💻 {student.repoUrl}</Text>
                        </TouchableOpacity>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <GradeBar grade={student.grade} t={t} />
                      </View>
                    </View>
                  </View>
                  <View style={s.groupRight}>
                    <TouchableOpacity
                      style={[s.editBtnSmall, { borderColor: t.accent }]}
                      onPress={() => startEditing(student)}
                    >
                      <Text style={[s.editBtnSmallText, { color: t.accent }]}>✏️</Text>
                    </TouchableOpacity>
                    <View style={[s.gradeBox, {
                      backgroundColor: student.grade !== null ? gradeColor(student.grade, t) + '18' : t.surfaceHigh,
                    }]}>
                      <Text style={[s.gradeVal, { color: gradeColor(student.grade, t) }]}>
                        {student.grade !== null ? student.grade.toFixed(2) : 'CAN'}
                      </Text>
                      {student.grade !== null && (
                        <Text style={[s.gradeSub, { color: gradeColor(student.grade, t) }]}>/20</Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        ))}

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { paddingHorizontal: 18 },
  notFound:  { textAlign: 'center', marginTop: 80, fontSize: 15 },
  back:      { marginBottom: 16 },
  backText:  { fontSize: 14, fontWeight: '600' },
  hero:      { borderRadius: 20, padding: 18, borderWidth: 1, gap: 8, marginBottom: 16 },
  domTag:    { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  domText:   { fontSize: 12, fontWeight: '700' },
  code:      { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroName:  { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  heroBadge: { fontSize: 13 },
  meta:      { fontSize: 13 },
  desc:      { fontSize: 13, lineHeight: 20 },
  infoBox:   { borderRadius: 10, padding: 12, gap: 4 },
  infoLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 13, lineHeight: 19 },
  heroImage: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12 },
  statsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statBox:   { borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', minWidth: 70, flex: 1 },
  statVal:   { fontSize: 16, fontWeight: '800' },
  statLbl:   { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  section:   { fontSize: 19, fontWeight: '800', marginBottom: 12 },
  groupCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8 },
  groupLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  groupRank: { fontSize: 12, fontWeight: '700', width: 24, paddingTop: 2 },
  memberName:{ fontSize: 14, fontWeight: '600' },
  urlText:   { fontSize: 12, marginTop: 4 },
  gradeBox:  { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
               flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  gradeVal:  { fontSize: 20, fontWeight: '900' },
  gradeSub:  { fontSize: 11 },
  groupRight: { alignItems: 'center', gap: 8 },
  editBtnSmall: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  editBtnSmallText: { fontSize: 12 },
  editContainer: { padding: 16, gap: 12 },
  editTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  editLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  editInput: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  editButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, flex: 1, alignItems: 'center' },
  editBtnCancel: { backgroundColor: 'transparent' },
  editBtnSave: {},
  editBtnText: { fontSize: 14, fontWeight: '600' },
});