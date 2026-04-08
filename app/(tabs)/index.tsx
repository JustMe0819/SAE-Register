import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing, FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay, withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API, API_BASE } from '../../constants/api';
import { DOMAIN_META, useTheme } from '../../constants/theme';
import type { SaeDTO } from '../../constants/types';

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
  val: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
});

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, delay, accent, decimals = 0, t }: {
  label: string; value: number; delay: number;
  accent?: boolean; decimals?: number;
  t: ReturnType<typeof useTheme>;
}) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14 }));
  }, []);
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.View style={[anim, sc.wrap, {
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

// ── SAE card ──────────────────────────────────────────────────────────────────
function SAECard({ sae, index, t }: {
  sae: SaeDTO; index: number; t: ReturnType<typeof useTheme>;
}) {
  const router   = useRouter();
  const meta     = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
  const scale    = useSharedValue(1);
  const opacity  = useSharedValue(0);
  const translateY = useSharedValue(30);
  useEffect(() => {
    const delay = 400 + index * 120;
    opacity.value    = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 12 }));
  }, []);
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));
  return (
    <Animated.View style={[anim, { width: COL }]}>
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
        {sae.illustration && (
          <Image source={{ uri: API_BASE + sae.illustration }} style={scard.image} />
        )}
        <Text style={[scard.code, { color: t.textMuted }]}>{sae.code}</Text>
        <Text style={[scard.name, { color: t.text }]} numberOfLines={2}>{sae.name}</Text>
        <Text style={[scard.badge, { color: t.textSub, backgroundColor: t.surfaceHigh }]}>
          {sae.year} · S{sae.semester}
        </Text>
        <View style={[scard.divider, { backgroundColor: t.border }]} />
        <View style={scard.stats}>
          {[
            { v: sae.stats.avg?.toFixed(2) ?? '–', l: 'moy.', accent: true },
            { v: String(sae.students.length),          l: 'étu.' },
            { v: sae.stats.max?.toFixed(2) ?? '–', l: 'max' },
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
  image:    { width: 40, height: 40, borderRadius: 8, alignSelf: 'center' },
  code:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  name:     { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  badge:    { fontSize: 10, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden', alignSelf: 'flex-start' },
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
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    flex: 1,
  }));
  return (
    <Animated.View style={anim}>
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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [saes, setSaes]       = useState<SaeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const scrollY       = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
  const headerAnim    = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 120], [1, 0.3]),
    transform: [{ translateY: interpolate(scrollY.value, [0, 120], [0, -30]) }],
  }));

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

  const fetchSaes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API.saes);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: SaeDTO[] = await res.json();
      setSaes(data);
    } catch (e: any) {
      setError(e.message ?? 'Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSaes(); }, []);

  const totalStudents = saes.reduce((a, s) => a + (s.stats?.total ?? 0), 0);
  const allGrades = saes.flatMap(s =>
    s.students.filter(st => st.grade !== null).map(st => st.grade as number)
  );
  const globalAvg = allGrades.length
    ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
    : 0;

  const top5 = saes
    .flatMap(sae => sae.students.filter(st => st.grade !== null).map(st => ({ st, sae })))
    .sort((a, b) => (b.st.grade ?? 0) - (a.st.grade ?? 0))
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
        {/* Header */}
        <Animated.View style={[s.header, headerEntrance, headerAnim]}>
          <Text style={[s.eyebrow, { color: t.textMuted }]}>IUT GUSTAVE EIFFEL · MEAUX</Text>
          <Text style={[s.wordmark, { color: t.text }]}>SAE{'\n'}Register</Text>
          <View style={[s.pill, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
            <Text style={[s.pillText, { color: t.accent }]}>MMI2 & MMI3</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard label="SAé" value={saes.length} delay={150} t={t} />
          <StatCard label="Étudiants" value={totalStudents} delay={250} t={t} />
          <StatCard label="Moyenne" value={globalAvg} delay={350} decimals={2} accent t={t} />
        </View>

        {/* Error */}
        {error && (
          <TouchableOpacity
            style={[s.errorBox, { backgroundColor: t.danger + '18', borderColor: t.danger + '55' }]}
            onPress={fetchSaes}
          >
            <Text style={[s.errorText, { color: t.danger }]}>
              ⚠️ {error} — Appuyer pour réessayer
            </Text>
          </TouchableOpacity>
        )}

        {/* SAE grid */}
        {saes.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: t.text }]}>SAE enregistrées</Text>
              <TouchableOpacity onPress={() => router.push('/sae-liste')}>
                <Text style={[s.sectionLink, { color: t.accent }]}>Tout voir →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.grid}>
              {saes.map((sae, i) => (
                <SAECard key={sae.id} sae={sae} index={i} t={t} />
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!loading && saes.length === 0 && !error && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={s.emptyBox}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={[s.emptyTitle, { color: t.text }]}>Aucune SAE pour l'instant</Text>
            <Text style={[s.emptySub, { color: t.textSub }]}>
              Importez un fichier XLSX ou PDF pour commencer.
            </Text>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: t.accent }]}
              onPress={() => router.push('/import')}
            >
              <Text style={s.emptyBtnText}>📥 Importer</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Actions */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Actions</Text>
          <View style={s.actRow}>
            <ActionBtn emoji="🏆" label="Classement" route="/rang"      delay={500} t={t} />
            <ActionBtn emoji="🔍" label="Chercher"   route="/recherche" delay={580} t={t} />
            <ActionBtn emoji="📥" label="Importer"   route="/import"    delay={660} t={t} />
          </View>
        </View>

        {/* Top groupes */}
        {top5.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: t.text }]}>Top étudiants</Text>
            {top5.map(({ st, sae }, i) => {
              const meta = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
              return (
                <Animated.View
                  key={`${sae.id}-${st.id}`}
                  entering={FadeInDown.delay(700 + i * 60).springify()}
                >
                  <TouchableOpacity
                    style={[s.topRow, {
                      backgroundColor: t.surface,
                      borderColor: i === 0 ? t.accent : t.border,
                    }]}
                    onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
                  >
                    <Text style={[s.topRank, { color: i === 0 ? t.accent : t.textMuted }]}>
                      {['🥇','🥈','🥉','④','⑤'][i]}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.topName, { color: t.text }]} numberOfLines={1}>
                        {st.fullName}
                      </Text>
                      <Text style={[s.topMeta, { color: t.textSub }]}>
                        {sae.code} · {sae.domain} · {sae.year}
                      </Text>
                    </View>
                    <Text style={[s.topGrade, { color: i === 0 ? t.accent : t.text }]}>
                      {st.grade?.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

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
  wordmark:  { fontSize: 54, fontWeight: '900', letterSpacing: -2.5, lineHeight: 58, marginBottom: 14 },
  pill:      { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  pillText:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 28 },
  errorBox:  { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20 },
  errorText: { fontSize: 13 },
  section:     { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:{ fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  sectionLink: { fontSize: 13, fontWeight: '700' },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actRow:  { flexDirection: 'row', gap: 10 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  topRank:  { fontSize: 20, width: 28, textAlign: 'center' },
  topName:  { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  topMeta:  { fontSize: 11 },
  topGrade: { fontSize: 22, fontWeight: '900' },
  emptyBox:  { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle:{ fontSize: 18, fontWeight: '800' },
  emptySub:  { fontSize: 13, textAlign: 'center' },
  emptyBtn:  { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});