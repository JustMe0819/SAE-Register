import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, StatusBar, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, DOMAIN_META } from '../../constants/theme';
import { SAE_DATA, saeStats } from '../../data/saes';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, withSpring, interpolate, runOnJS,
  useAnimatedScrollHandler, Easing,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';

const { width } = Dimensions.get('window');
const COL = (width - 48 - 10) / 2;

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, delay = 0, decimals = 0, t }: {
  value: number; delay?: number; decimals?: number;
  t: ReturnType<typeof useTheme>;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start: number;
    const duration = 900;
    const timeout = setTimeout(() => {
      const animate = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(eased * value);
        if (progress < 1) requestAnimationFrame(animate);
        else setDisplay(value);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <Text style={[num.val, { color: t.accent }]}>
      {display.toFixed(decimals)}
    </Text>
  );
}
const num = StyleSheet.create({
  val: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
});

// ── Stat card with fade-in ────────────────────────────────────────────────────
function StatCard({ label, value, delay, accent, decimals = 0, t }: {
  label: string; value: number; delay: number;
  accent?: boolean; decimals?: number;
  t: ReturnType<typeof useTheme>;
}) {
  const opacity   = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, sc.wrap, {
      backgroundColor: accent ? t.accentBg : t.surface,
      borderColor: accent ? t.accent : t.border,
      flex: 1,
    }]}>
      <AnimatedNumber value={value} delay={delay + 100} decimals={decimals} t={t} />
      <Text style={[sc.label, { color: t.textSub }]}>{label}</Text>
    </Animated.View>
  );
}
const sc = StyleSheet.create({
  wrap:  { borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
});

// ── SAE card with press animation ─────────────────────────────────────────────
function SAECard({ sae, index, t }: {
  sae: typeof SAE_DATA[0]; index: number;
  t: ReturnType<typeof useTheme>;
}) {
  const router   = useRouter();
  const stats    = saeStats(sae);
  const meta     = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
  const scale    = useSharedValue(1);
  const opacity  = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    const delay = 400 + index * 120;
    opacity.value    = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 12 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, { width: COL }]}>
      <TouchableOpacity
        style={[scard.wrap, { backgroundColor: t.surface, borderColor: t.border }]}
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
      >
        <View style={[scard.tag, { backgroundColor: meta.color + '25' }]}>
          <Text style={[scard.tagText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
        </View>
        <Text style={[scard.code, { color: t.textMuted }]}>{sae.code}</Text>
        <Text style={[scard.name, { color: t.text }]} numberOfLines={2}>{sae.name}</Text>
        <Text style={[scard.badge, { color: t.textSub, backgroundColor: t.surfaceHigh }]}>
          {sae.year} · S{sae.semester}
        </Text>
        <View style={[scard.divider, { backgroundColor: t.border }]} />
        <View style={scard.stats}>
          {[
            { v: stats.avg?.toFixed(2) ?? '–', l: 'moy.', accent: true },
            { v: String(sae.groups.length),     l: 'grp.' },
            { v: String(stats.total),            l: 'étu.' },
          ].map((item) => (
            <View key={item.l} style={scard.statItem}>
              <Text style={[scard.statVal, { color: item.accent ? t.accent : t.text }]}>{item.v}</Text>
              <Text style={[scard.statLbl, { color: t.textMuted }]}>{item.l}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const scard = StyleSheet.create({
  wrap:     { borderRadius: 18, padding: 14, borderWidth: 1, gap: 7 },
  tag:      { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:  { fontSize: 11, fontWeight: '700' },
  code:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  name:     { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  badge:    { fontSize: 10, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
              overflow: 'hidden', alignSelf: 'flex-start' },
  divider:  { height: 1 },
  stats:    { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', gap: 1 },
  statVal:  { fontSize: 14, fontWeight: '800' },
  statLbl:  { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ emoji, label, route, delay, t }: {
  emoji: string; label: string; route: string; delay: number;
  t: ReturnType<typeof useTheme>;
}) {
  const router   = useRouter();
  const scale    = useSharedValue(1);
  const opacity  = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    flex: 1,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[ab.wrap, { backgroundColor: t.surface, borderColor: t.border }]}
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={() => router.push(route as any)}
      >
        <Text style={ab.emoji}>{emoji}</Text>
        <Text style={[ab.label, { color: t.textSub }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ab = StyleSheet.create({
  wrap:  { borderRadius: 16, padding: 14, alignItems: 'center', gap: 7, borderWidth: 1 },
  emoji: { fontSize: 26 },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});

// ── Top row ───────────────────────────────────────────────────────────────────
function TopRow({ g, sae, index, t }: {
  g: any; sae: any; index: number;
  t: ReturnType<typeof useTheme>;
}) {
  const router   = useRouter();
  const scale    = useSharedValue(1);
  const opacity  = useSharedValue(0);
  const translateX = useSharedValue(-20);
  const MEDALS   = ['🥇','🥈','🥉','④','⑤'];

  useEffect(() => {
    const delay = 700 + index * 80;
    opacity.value    = withDelay(delay, withTiming(1, { duration: 350 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 14 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[tr.row, {
          backgroundColor: t.surface,
          borderColor: index === 0 ? t.accent : t.border,
        }]}
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
      >
        <Text style={[tr.medal, { color: index === 0 ? t.accent : t.textMuted }]}>
          {MEDALS[index]}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={[tr.name, { color: t.text }]} numberOfLines={1}>
            {g.members.join(' · ')}
          </Text>
          <Text style={[tr.meta, { color: t.textSub }]}>
            {sae.code} · {sae.domain}
          </Text>
        </View>
        <Text style={[tr.grade, { color: index === 0 ? t.accent : t.text }]}>
          {g.grade?.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const tr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
           borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  medal: { fontSize: 20, width: 28, textAlign: 'center' },
  name:  { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  meta:  { fontSize: 11 },
  grade: { fontSize: 22, fontWeight: '900' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Parallax header
  const scrollY      = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 120], [1, 0.3]),
    transform: [{ translateY: interpolate(scrollY.value, [0, 120], [0, -30]) }],
  }));

  // Header fade in
  const headerOpacity = useSharedValue(0);
  const headerSlide   = useSharedValue(-10);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerSlide.value   = withSpring(0, { damping: 16 });
  }, []);
  const headerEntrance = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerSlide.value }],
  }));

  const totalStudents = SAE_DATA.reduce((a, s) => a + saeStats(s).total, 0);
  const allGrades = SAE_DATA.flatMap((s) =>
    s.groups.flatMap((g) => g.members.map(() => g.grade)).filter((g): g is number => g !== null)
  );
  const globalAvg = allGrades.length
    ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
    : 0;

  const top5 = SAE_DATA
    .flatMap((sae) => sae.groups.filter((g) => g.grade !== null).map((g) => ({ g, sae })))
    .sort((a, b) => (b.g.grade ?? 0) - (a.g.grade ?? 0))
    .slice(0, 5);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[s.header, headerEntrance, headerAnim]}>
          <Text style={[s.eyebrow, { color: t.textMuted }]}>IUT GUSTAVE EIFFEL · MEAUX</Text>
          <Text style={[s.wordmark, { color: t.text }]}>SAE{'\n'}Register</Text>
          <View style={[s.pill, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
            <Text style={[s.pillText, { color: t.accent }]}>MMI2 & MMI3</Text>
          </View>
        </Animated.View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <StatCard label="SAé" value={SAE_DATA.length} delay={150} t={t} />
          <StatCard label="Étudiants" value={totalStudents} delay={250} t={t} />
          <StatCard label="Moyenne" value={globalAvg} delay={350} decimals={2} accent t={t} />
        </View>

        {/* ── SAé cards ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={[s.sectionTitle, { color: t.text }]}>SAé enregistrées</Text>
            <TouchableOpacity onPress={() => router.push('/sae-liste')}>
              <Text style={[s.sectionLink, { color: t.accent }]}>Tout voir →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.grid}>
            {SAE_DATA.map((sae, i) => (
              <SAECard key={sae.id} sae={sae} index={i} t={t} />
            ))}
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Actions</Text>
          <View style={s.actRow}>
            <ActionBtn emoji="🏆" label="Classement" route="/rang"      delay={500} t={t} />
            <ActionBtn emoji="🔍" label="Chercher"   route="/recherche" delay={580} t={t} />
            <ActionBtn emoji="📥" label="Importer"   route="/import"    delay={660} t={t} />
          </View>
        </View>

        {/* ── Top groupes ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Top groupes</Text>
          {top5.map(({ g, sae }, i) => (
            <TopRow key={`${sae.id}-${g.id}`} g={g} sae={sae} index={i} t={t} />
          ))}
        </View>

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header:    { marginBottom: 28, paddingTop: 4 },
  eyebrow:   { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12, fontWeight: '600' },
  wordmark:  { fontSize: 58, fontWeight: '900', letterSpacing: -2.5, lineHeight: 62, marginBottom: 14 },
  pill:      { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1,
               paddingHorizontal: 12, paddingVertical: 5 },
  pillText:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 32 },

  section:     { marginBottom: 32 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:{ fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  sectionLink: { fontSize: 13, fontWeight: '700' },

  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actRow:  { flexDirection: 'row', gap: 10 },
});