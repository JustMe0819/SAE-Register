import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API } from '../constants/api';
import { DOMAIN_META, useTheme } from '../constants/theme';
import type { SaeDTO } from '../constants/types';

const MEDALS = ['🥇', '🥈', '🥉'];

// Composant séparé pour chaque ligne → les hooks sont appelés au niveau composant
function RankRow({ st, sae, index, t }: {
  st: any; sae: SaeDTO; index: number; t: ReturnType<typeof useTheme>;
}) {
  const router = useRouter();
  const meta   = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
  const isTop  = index < 3;

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(14)}>
      <TouchableOpacity
        style={[s.row, {
          backgroundColor: t.surface,
          borderColor: isTop ? t.accent + (index === 0 ? 'DD' : '55') : t.border,
        }]}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
      >
        <Text style={[s.rank, { color: isTop ? t.accent : t.textMuted }]}>
          {index < 3 ? MEDALS[index] : `#${index + 1}`}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.members, { color: t.text }]} numberOfLines={1}>
            {st.fullName}
          </Text>
          <View style={s.meta}>
            <View style={[s.domPill, { backgroundColor: meta.color + '20' }]}>
              <Text style={[s.domText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
            </View>
            <Text style={[s.metaText, { color: t.textSub }]}>{sae.code} · {sae.year}</Text>
          </View>
        </View>
        <Text style={[s.grade, { color: index === 0 ? t.accent : t.text }]}>
          {st.grade?.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RankingScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [saes, setSaes]     = useState<SaeDTO[]>([]);
  const [filter, setFilter] = useState<'Tous' | 'MMI2' | 'MMI3'>('Tous');

  useEffect(() => {
    fetch(API.saes).then(r => r.json()).then(setSaes).catch(() => {});
  }, []);

  const all = saes
    .filter(s => filter === 'Tous' || s.year === filter)
    .flatMap(sae => sae.students.filter(st => st.grade !== null).map(st => ({ st, sae })))
    .sort((a, b) => (b.st.grade ?? 0) - (a.st.grade ?? 0));

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={s.header}>
        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[s.back, { color: t.textSub }]}>← Retour</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text style={[s.title, { color: t.text }]}>Classement</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.tabs}>
          {(['Tous', 'MMI2', 'MMI3'] as const).map(y => (
            <TouchableOpacity
              key={y}
              style={[s.tab, {
                backgroundColor: filter === y ? t.accentBg : t.chipBg,
                borderColor: filter === y ? t.accent : t.border,
              }]}
              onPress={() => setFilter(y)}
            >
              <Text style={[s.tabText, { color: filter === y ? t.accent : t.chipText }]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {all.map(({ st, sae }, i) => (
          <RankRow key={`${sae.id}-${st.id}`} st={st} sae={sae} index={i} t={t} />
        ))}
        {all.length === 0 && (
          <Text style={[s.empty, { color: t.textMuted }]}>Aucune donnée</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  back:    { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  title:   { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 14 },
  tabs:    { flexDirection: 'row', gap: 8 },
  tab:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },
  list:    { paddingHorizontal: 16 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  rank:    { fontSize: 20, width: 32, textAlign: 'center' },
  members: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  domPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  domText: { fontSize: 10, fontWeight: '700' },
  metaText:{ fontSize: 11 },
  grade:   { fontSize: 24, fontWeight: '900' },
  empty:   { textAlign: 'center', marginTop: 48, fontSize: 14 },
});