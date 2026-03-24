import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withDelay, withTiming, FadeInDown,
} from 'react-native-reanimated';
import { useTheme, DOMAIN_META } from '../constants/theme';
import { SAE_DATA, saeStats } from '../data/saes';

const YEARS   = ['Tous', 'MMI2', 'MMI3'] as const;
const DOMAINS = ['Tous', ...Object.keys(DOMAIN_META).filter(d => d !== 'Autre')] as const;

function Chip({ label, active, onPress, color, t }: {
  label: string; active: boolean; onPress: () => void;
  color?: string; t: ReturnType<typeof useTheme>;
}) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[ch.wrap, {
          backgroundColor: active ? (color ? color + '25' : t.chipActive) : t.chipBg,
          borderColor:     active ? (color ?? t.chipActiveBorder) : t.border,
        }]}
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Text style={[ch.text, { color: active ? (color ?? t.chipActiveText) : t.chipText }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ch = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 7 },
  text: { fontSize: 12, fontWeight: '700' },
});

function SAERow({ sae, index, t }: {
  sae: typeof SAE_DATA[0]; index: number;
  t: ReturnType<typeof useTheme>;
}) {
  const router = useRouter();
  const scale  = useSharedValue(1);
  const anim   = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const stats  = saeStats(sae);
  const meta   = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(14)}
      style={anim}
    >
      <TouchableOpacity
        style={[row.card, { backgroundColor: t.surface, borderColor: t.border }]}
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
      >
        <View style={row.top}>
          <View style={[row.tag, { backgroundColor: meta.color + '22' }]}>
            <Text style={[row.tagText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
          </View>
          <Text style={[row.year, { color: t.textSub }]}>{sae.year} · S{sae.semester}</Text>
        </View>
        <Text style={[row.code, { color: t.textMuted }]}>{sae.code}</Text>
        <Text style={[row.name, { color: t.text }]}>{sae.name}</Text>
        <View style={row.foot}>
          <Text style={[row.meta, { color: t.textSub }]}>
            {stats.total} étudiants · {sae.groups.length} groupes
          </Text>
          <Text style={[row.avg, { color: t.accent }]}>
            ⌀ {stats.avg?.toFixed(2) ?? '–'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const row = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, gap: 6 },
  top:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
  year: { fontSize: 11 },
  code: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  name: { fontSize: 15, fontWeight: '700' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  meta: { fontSize: 12 },
  avg:  { fontSize: 17, fontWeight: '900' },
});

export default function SAEListScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch]   = useState('');
  const [year, setYear]       = useState<string>('Tous');
  const [domain, setDomain]   = useState<string>('Tous');

  // input focus animation
  const inputBorder = useSharedValue(0);
  const inputAnim   = useAnimatedStyle(() => ({
    borderColor: inputBorder.value === 1
      ? t.accent
      : t.border,
  }));

  const filtered = useMemo(() => SAE_DATA.filter((s) => {
    const mY = year   === 'Tous' || s.year === year;
    const mD = domain === 'Tous' || s.domain === domain;
    const mS = !search || s.name.toLowerCase().includes(search.toLowerCase())
      || s.code.toLowerCase().includes(search.toLowerCase());
    return mY && mD && mS;
  }), [search, year, domain]);

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <Animated.View style={[s.inputWrap, inputAnim, { backgroundColor: t.inputBg }]}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[s.input, { color: t.text }]}
            placeholder="Rechercher une SAé…"
            placeholderTextColor={t.textMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => { inputBorder.value = withTiming(1, { duration: 200 }); }}
            onBlur={() => { inputBorder.value = withTiming(0, { duration: 200 }); }}
          />
        </Animated.View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }} contentContainerStyle={s.chips}>
        {YEARS.map((y) => (
          <Chip key={y} label={y} active={year === y} onPress={() => setYear(y)} t={t} />
        ))}
        <View style={{ width: 1, backgroundColor: t.border, marginHorizontal: 4 }} />
        {DOMAINS.filter(d => d !== 'Tous').map((d) => {
          const m = DOMAIN_META[d];
          return (
            <Chip key={d} label={`${m?.icon} ${d}`} active={domain === d}
              onPress={() => setDomain(d === domain ? 'Tous' : d)}
              color={m?.color} t={t} />
          );
        })}
      </ScrollView>

      <Text style={[s.count, { color: t.textMuted }]}>{filtered.length} SAé</Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {filtered.map((sae, i) => (
          <SAERow key={sae.id} sae={sae} index={i} t={t} />
        ))}
        {filtered.length === 0 && (
          <Text style={[s.empty, { color: t.textMuted }]}>Aucune SAé trouvée</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5 },
  input:    { flex: 1, fontSize: 14 },
  chips:    { paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  count:    { paddingHorizontal: 18, fontSize: 11, marginBottom: 4 },
  empty:    { textAlign: 'center', marginTop: 48, fontSize: 14 },
});