import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { useTheme, DOMAIN_META } from '../constants/theme';
import { SAE_DATA } from '../data/saes';

const MEDALS = ['🥇', '🥈', '🥉'];

function RankRow({ g, sae, index, t }: {
  g: any; sae: any; index: number; t: ReturnType<typeof useTheme>;
}) {
  const router = useRouter();
  const scale  = useSharedValue(1);
  const anim   = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const meta   = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
  const isTop  = index < 3;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).springify().damping(14)}
      style={anim}
    >
      <TouchableOpacity
        style={[s.row, {
          backgroundColor: t.surface,
          borderColor: isTop ? t.accent + (index === 0 ? 'DD' : '55') : t.border,
        }]}
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
      >
        <Text style={[s.rank, { color: isTop ? t.accent : t.textMuted }]}>
          {index < 3 ? MEDALS[index] : `#${index + 1}`}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.members, { color: t.text }]} numberOfLines={1}>
            {g.members.join(' · ')}
          </Text>
          <View style={s.meta}>
            <View style={[s.domPill, { backgroundColor: meta.color + '20' }]}>
              <Text style={[s.domText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
            </View>
            <Text style={[s.metaText, { color: t.textSub }]}>{sae.code} · {sae.year}</Text>
          </View>
        </View>
        <Text style={[s.grade, { color: index === 0 ? t.accent : t.text }]}>
          {g.grade?.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RankingScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<'Tous' | 'MMI2' | 'MMI3'>('Tous');

  const all = SAE_DATA
    .filter((s) => filter === 'Tous' || s.year === filter)
    .flatMap((sae) =>
      sae.groups.filter((g) => g.grade !== null).map((g) => ({ g, sae }))
    )
    .sort((a, b) => (b.g.grade ?? 0) - (a.g.grade ?? 0));

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
          {(['Tous', 'MMI2', 'MMI3'] as const).map((y) => {
            const scale = useSharedValue(1);
            const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
            return (
              <Animated.View key={y} style={anim}>
                <TouchableOpacity
                  style={[s.tab, {
                    backgroundColor: filter === y ? t.accentBg : t.chipBg,
                    borderColor: filter === y ? t.accent : t.border,
                  }]}
                  onPressIn={() => { scale.value = withSpring(0.93); }}
                  onPressOut={() => { scale.value = withSpring(1); }}
                  onPress={() => setFilter(y)}
                >
                  <Text style={[s.tabText, { color: filter === y ? t.accent : t.chipText }]}>{y}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {all.map(({ g, sae }, i) => (
          <RankRow key={`${sae.id}-${g.id}`} g={g} sae={sae} index={i} t={t} />
        ))}
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
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12,
             padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  rank:    { fontSize: 20, width: 32, textAlign: 'center' },
  members: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  domPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  domText: { fontSize: 10, fontWeight: '700' },
  metaText:{ fontSize: 11 },
  grade:   { fontSize: 24, fontWeight: '900' },
});