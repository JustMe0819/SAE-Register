import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API } from '../constants/api';
import { DOMAIN_META, useTheme } from '../constants/theme';
import type { SaeDTO } from '../constants/types';

const YEARS   = ['Tous', 'MMI2', 'MMI3'] as const;
const DOMAINS = ['Tous', ...Object.keys(DOMAIN_META).filter(d => d !== 'Autre')] as const;

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress, color, t }: {
  label: string; active: boolean; onPress: () => void;
  color?: string; t: ReturnType<typeof useTheme>;
}) {
  return (
    <TouchableOpacity
      style={[ch.wrap, {
        backgroundColor: active ? (color ? color + '25' : t.chipActive) : t.chipBg,
        borderColor:     active ? (color ?? t.chipActiveBorder) : t.border,
      }]}
      onPress={onPress}
    >
      <Text style={[ch.text, { color: active ? (color ?? t.chipActiveText) : t.chipText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 7 },
  text: { fontSize: 12, fontWeight: '700' },
});

// ── SAE row — composant séparé pour éviter les hooks dans map() ───────────────
function SAERow({ sae, index, t }: {
  sae: SaeDTO; index: number; t: ReturnType<typeof useTheme>;
}) {
  const router = useRouter();
  const meta   = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)}>
      <TouchableOpacity
        style={[row.card, { backgroundColor: t.surface, borderColor: t.border }]}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
      >
        <View style={row.top}>
          <View style={[row.tag, { backgroundColor: meta.color + '22' }]}>
            <Text style={[row.tagText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
          </View>        {sae.illustration && (
          <Image source={{ uri: 'http://localhost:8080' + sae.illustration }} style={row.image} />
        )}          <Text style={[row.year, { color: t.textSub }]}>{sae.year} · S{sae.semester}</Text>
        </View>
        <Text style={[row.code, { color: t.textMuted }]}>{sae.code}</Text>
        <Text style={[row.name, { color: t.text }]}>{sae.name}</Text>
        <View style={row.foot}>
          <Text style={[row.meta, { color: t.textSub }]}>
            {sae.stats.total} étudiants · {sae.groups.length} groupes
          </Text>
          <Text style={[row.avg, { color: t.accent }]}>
            ⌀ {sae.stats.avg?.toFixed(2) ?? '–'}
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
  image: { width: 40, height: 40, borderRadius: 8, alignSelf: 'center' },
  year: { fontSize: 11 },
  code: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  name: { fontSize: 15, fontWeight: '700' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  meta: { fontSize: 12 },
  avg:  { fontSize: 17, fontWeight: '900' },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SAEListScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const [saes, setSaes]     = useState<SaeDTO[]>([]);
  const [search, setSearch] = useState('');
  const [year, setYear]     = useState<string>('Tous');
  const [domain, setDomain] = useState<string>('Tous');

  const inputBorder = useSharedValue(0);
  const inputAnim   = useAnimatedStyle(() => ({
    borderColor: inputBorder.value === 1 ? t.accent : t.border,
  }));

  const fetchSaes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (year !== 'Tous')   params.append('year', year);
      if (domain !== 'Tous') params.append('domain', domain);
      const res = await fetch(`${API.saes}?${params}`);
      const data: SaeDTO[] = await res.json();
      setSaes(data);
    } catch {}
  }, [year, domain]);

  useEffect(() => { fetchSaes(); }, [fetchSaes]);

  const filtered = useMemo(() => saes.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  ), [saes, search]);

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
        {YEARS.map(y => (
          <Chip key={y} label={y} active={year === y} onPress={() => setYear(y)} t={t} />
        ))}
        <View style={{ width: 1, backgroundColor: t.border, marginHorizontal: 4 }} />
        {DOMAINS.filter(d => d !== 'Tous').map(d => {
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
  root:      { flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14,
               paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5 },
  input:     { flex: 1, fontSize: 14 },
  chips:     { paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  count:     { paddingHorizontal: 18, fontSize: 11, marginBottom: 4 },
  empty:     { textAlign: 'center', marginTop: 48, fontSize: 14 },
});