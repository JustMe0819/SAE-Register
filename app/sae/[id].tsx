import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeIn, useAnimatedScrollHandler, interpolate } from 'react-native-reanimated';
import { useTheme, DOMAIN_META } from '../../constants/theme';
import { API } from '../../constants/api';
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
  const sorted = [...sae.groups].sort((a, b) => (b.grade ?? -1) - (a.grade ?? -1));

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
        <Animated.View style={[s.hero, heroAnim, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[s.domTag, { backgroundColor: meta.color + '22' }]}>
            <Text style={[s.domText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
          </View>
          <Text style={[s.code, { color: t.textSub }]}>{sae.code}</Text>
          <Text style={[s.heroName, { color: t.text }]}>{sae.name}</Text>
          <Text style={[s.heroBadge, { color: t.textSub }]}>{sae.year} · Semestre {sae.semester} · {sae.ue}</Text>
          {sae.description && <Text style={[s.desc, { color: t.textSub }]}>{sae.description}</Text>}
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={s.statsRow}>
            {[
              { v: String(sae.stats.total),         l: 'étudiants' },
              { v: String(sae.stats.graded),         l: 'notés' },
              { v: String(sae.groups.length),        l: 'groupes' },
              { v: sae.stats.avg?.toFixed(2) ?? '–', l: 'moyenne', accent: true },
              { v: sae.stats.max?.toFixed(2) ?? '–', l: 'max' },
              { v: sae.stats.min?.toFixed(2) ?? '–', l: 'min' },
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
        <Text style={[s.section, { color: t.text }]}>Groupes</Text>
        {sorted.map((g, i) => (
          <Animated.View key={g.id} entering={FadeInDown.delay(150 + i * 50).springify().damping(14)}>
            <View style={[s.groupCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={s.groupLeft}>
                <Text style={[s.groupRank, { color: t.textMuted }]}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  {g.members.map(m => (
                    <Text key={m} style={[s.memberName, { color: t.text }]}>{m}</Text>
                  ))}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <GradeBar grade={g.grade} t={t} />
                  </View>
                </View>
              </View>
              <View style={[s.gradeBox, { backgroundColor: g.grade !== null ? gradeColor(g.grade, t) + '18' : t.surfaceHigh }]}>
                <Text style={[s.gradeVal, { color: gradeColor(g.grade, t) }]}>
                  {g.grade !== null ? g.grade.toFixed(2) : 'CAN'}
                </Text>
                {g.grade !== null && <Text style={[s.gradeSub, { color: gradeColor(g.grade, t) }]}>/20</Text>}
              </View>
            </View>
          </Animated.View>
        ))}
        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  scroll:   { paddingHorizontal: 18 },
  notFound: { textAlign: 'center', marginTop: 80, fontSize: 15 },
  back:     { marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '600' },
  hero:     { borderRadius: 20, padding: 18, borderWidth: 1, gap: 7, marginBottom: 16 },
  domTag:   { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  domText:  { fontSize: 12, fontWeight: '700' },
  code:     { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  heroBadge:{ fontSize: 13 },
  desc:     { fontSize: 13, lineHeight: 20, marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statBox:  { borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', minWidth: 80, flex: 1 },
  statVal:  { fontSize: 18, fontWeight: '800' },
  statLbl:  { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  section:  { fontSize: 19, fontWeight: '800', marginBottom: 12 },
  groupCard:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8 },
  groupLeft:{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  groupRank:{ fontSize: 12, fontWeight: '700', width: 24, paddingTop: 2 },
  memberName:{ fontSize: 14, fontWeight: '600' },
  gradeBox: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  gradeVal: { fontSize: 20, fontWeight: '900' },
  gradeSub: { fontSize: 11 },
});