import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useRef } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { useTheme, DOMAIN_META } from '../constants/theme';
import { findStudent } from '../data/saes';

export default function SearchScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState('');
  const inputRef  = useRef<TextInput>(null);

  const inputScale  = useSharedValue(1);
  const inputBorder = useSharedValue(0);
  const inputAnim   = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
    borderColor: inputBorder.value === 1 ? t.accent : t.borderStrong,
  }));

  const results = useMemo(() => (q.length >= 2 ? findStudent(q) : []), [q]);

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={s.header}>
        <Animated.View entering={FadeIn.duration(250)}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[s.back, { color: t.textSub }]}>← Retour</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text style={[s.title, { color: t.text }]}>Recherche</Text>
        </Animated.View>

        <Animated.View style={[s.inputWrap, inputAnim, { backgroundColor: t.inputBg }]}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[s.input, { color: t.text }]}
            placeholder="Nom d'un étudiant…"
            placeholderTextColor={t.textMuted}
            value={q}
            onChangeText={setQ}
            autoFocus
            onFocus={() => {
              inputBorder.value = withTiming(1, { duration: 200 });
              inputScale.value  = withSpring(1.02, { damping: 15 });
            }}
            onBlur={() => {
              inputBorder.value = withTiming(0, { duration: 200 });
              inputScale.value  = withSpring(1, { damping: 12 });
            }}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')}>
              <Text style={{ fontSize: 16, color: t.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {q.length >= 2 && (
          <Animated.Text
            entering={FadeIn.duration(200)}
            style={[s.hint, { color: t.textMuted }]}
          >
            {results.length} résultat{results.length !== 1 ? 's' : ''}
          </Animated.Text>
        )}
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {q.length < 2 && (
          <Animated.Text entering={FadeIn.delay(200).duration(400)}
            style={[s.placeholder, { color: t.textMuted }]}>
            Tapez au moins 2 caractères pour chercher un étudiant dans toutes les SAé.
          </Animated.Text>
        )}

        {results.map(({ group, sae }, i) => {
          const meta    = DOMAIN_META[sae.domain] ?? DOMAIN_META['Autre'];
          const matched = group.members.filter(m => m.toLowerCase().includes(q.toLowerCase()));
          const teammates = group.members.filter(m => !m.toLowerCase().includes(q.toLowerCase()));
          const scale   = useSharedValue(1);
          const anim    = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

          return (
            <Animated.View
              key={`${sae.id}-${group.id}`}
              entering={FadeInDown.delay(i * 60).springify().damping(14)}
              style={anim}
            >
              <TouchableOpacity
                style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}
                activeOpacity={1}
                onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
                onPressOut={() => { scale.value = withSpring(1); }}
                onPress={() => router.push({ pathname: '/sae/[id]', params: { id: sae.id } })}
              >
                <View style={s.cardTop}>
                  <View style={[s.domTag, { backgroundColor: meta.color + '20' }]}>
                    <Text style={[s.domText, { color: meta.color }]}>{meta.icon} {sae.domain}</Text>
                  </View>
                  <Text style={[s.saeCode, { color: t.textSub }]}>{sae.code} · {sae.year}</Text>
                </View>
                <Text style={[s.saeName, { color: t.textSub }]}>{sae.name}</Text>
                <View style={[s.divider, { backgroundColor: t.border }]} />
                {matched.map((m) => (
                  <Text key={m} style={[s.matchName, { color: t.text }]}>🎯 {m}</Text>
                ))}
                {teammates.length > 0 && (
                  <Text style={[s.teammates, { color: t.textSub }]}>
                    Groupe avec : {teammates.join(', ')}
                  </Text>
                )}
                <View style={s.gradeRow}>
                  <Text style={[s.gradeLabel, { color: t.textMuted }]}>Note du groupe</Text>
                  <Text style={[s.gradeVal, { color: group.grade !== null ? t.accent : t.textMuted }]}>
                    {group.grade !== null ? `${group.grade.toFixed(2)}/20` : 'CAN'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  back:    { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  title:   { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 14 },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5 },
  input:   { flex: 1, fontSize: 15 },
  hint:    { fontSize: 11, marginTop: 6, marginLeft: 2 },
  list:    { paddingHorizontal: 16, paddingTop: 8 },
  placeholder: { textAlign: 'center', marginTop: 48, fontSize: 14, lineHeight: 22 },
  card:    { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  domTag:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  domText: { fontSize: 11, fontWeight: '700' },
  saeCode: { fontSize: 11 },
  saeName: { fontSize: 12 },
  divider: { height: 1 },
  matchName: { fontSize: 15, fontWeight: '800' },
  teammates: { fontSize: 12 },
  gradeRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  gradeLabel:{ fontSize: 11 },
  gradeVal:  { fontSize: 20, fontWeight: '900' },
});