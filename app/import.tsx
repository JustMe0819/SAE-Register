import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeIn, ZoomIn,
} from 'react-native-reanimated';
import { useTheme, DOMAIN_META } from '../constants/theme';
import { API } from '../constants/api';
import type { SaeDTO } from '../constants/types';

const DOMAINS = Object.keys(DOMAIN_META).filter(d => d !== 'Autre');
const YEARS   = ['MMI2', 'MMI3'];
const SEMS    = ['1','2','3','4','5','6'];

export default function ImportScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const fileInputRef = useRef<any>(null);
  const imageInputRef = useRef<any>(null); // Nouveau ref pour l'input image web

  const [fileName, setFileName] = useState<string | null>(null);
  const [nativeUri, setNativeUri] = useState<string | null>(null); // mobile only
  const [webFile, setWebFile]     = useState<File | null>(null);   // web only
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<SaeDTO | null>(null);

  // Nouveaux états pour l'image d'illustration
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageNativeUri, setImageNativeUri] = useState<string | null>(null); // mobile only
  const [imageWebFile, setImageWebFile] = useState<File | null>(null); // web only

  const [code, setCode]         = useState('');
  const [name, setName]         = useState('');
  const [year, setYear]         = useState('MMI3');
  const [semester, setSemester] = useState('5');
  const [domain, setDomain]     = useState('Web');
  const [ue, setUe]             = useState('');
  const [desc, setDesc]         = useState('');
  const [competences, setCompetences] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  const zoneScale = useSharedValue(1);
  const zoneAnim  = useAnimatedStyle(() => ({ transform: [{ scale: zoneScale.value }] }));

  const imageZoneScale = useSharedValue(1); // Nouveau pour l'animation de la zone image
  const imageZoneAnim = useAnimatedStyle(() => ({ transform: [{ scale: imageZoneScale.value }] }));

  // ── Sélection du fichier ────────────────────────────────────────────────────
  async function pickFile() {
    setError(null);
    setResult(null);

    if (Platform.OS === 'web') {
      // Sur web : déclenche l'input file HTML caché
      fileInputRef.current?.click();
    } else {
      // Sur mobile natif : DocumentPicker
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
        setFileName(res.assets[0].name);
        setNativeUri(res.assets[0].uri);
      } catch (e: any) {
        setError(e.message);
      }
    }
  }

  // ── Sélection de l'image d'illustration ─────────────────────────────────────
  async function pickImage() {
    setError(null);
    setResult(null);

    if (Platform.OS === 'web') {
      // Sur web : déclenche l'input image HTML caché
      imageInputRef.current?.click();
    } else {
      // Sur mobile natif : DocumentPicker pour images
      try {
        const res = await DocumentPicker.getDocumentAsync({
          type: ['image/*'], // Accepte tous les types d'images
          copyToCacheDirectory: true,
        });
        if (res.canceled) return;
        setImageFileName(res.assets[0].name);
        setImageNativeUri(res.assets[0].uri);
      } catch (e: any) {
        setError(e.message);
      }
    }
  }

  // ── Callback input file web ─────────────────────────────────────────────────
  function onWebFileChange(e: any) {
    const f: File = e.target.files?.[0];
    if (!f) return;
    setWebFile(f);
    setFileName(f.name);
  }

  // ── Callback input image web ───────────────────────────────────────────────
  function onWebImageChange(e: any) {
    const f: File = e.target.files?.[0];
    if (!f) return;
    setImageWebFile(f);
    setImageFileName(f.name);
  }

  // ── Envoi au back ───────────────────────────────────────────────────────────
  async function submit() {
    if (!fileName) { setError('Choisissez un fichier.'); return; }
    if (!code.trim() || !name.trim()) { setError('Code et nom obligatoires.'); return; }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Web : on utilise le vrai objet File du navigateur
        if (!webFile) { setError('Fichier introuvable.'); return; }
        formData.append('file', webFile);
        // Ajouter l'image si présente
        if (imageWebFile) {
          formData.append('illustration', imageWebFile);
        }
      } else {
        // Mobile natif : URI Expo
        const fileType = fileName.endsWith('.pdf')
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        formData.append('file', { uri: nativeUri, name: fileName, type: fileType } as any);
        // Ajouter l'image si présente
        if (imageFileName && imageNativeUri) {
          formData.append('illustration', { uri: imageNativeUri, name: imageFileName, type: 'image/*' } as any);
        }
      }

      formData.append('code', code);
      formData.append('name', name);
      formData.append('year', year);
      formData.append('semester', semester);
      formData.append('domain', domain);
      formData.append('ue', ue);
      formData.append('description', desc);
      formData.append('competences', competences);
      formData.append('dateDebut', dateDebut);
      formData.append('dateFin', dateFin);
      formData.append('siteUrl', siteUrl);
      formData.append('repoUrl', repoUrl);

      const res = await fetch(API.import, {
        method: 'POST',
        body: formData,
        // PAS de Content-Type manuel — le navigateur/RN le gère avec le bon boundary
      });

      if (!res.ok) throw new Error(`Erreur serveur ${res.status}`);
      const data: SaeDTO = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'import.");
    } finally {
      setLoading(false);
    }
  }

  function ChipRow({ options, value, onChange }: {
    options: string[]; value: string; onChange: (v: string) => void;
  }) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {options.map(o => (
          <TouchableOpacity
            key={o}
            style={[chip.wrap, {
              backgroundColor: value === o ? t.accentBg : t.chipBg,
              borderColor: value === o ? t.accent : t.border,
            }]}
            onPress={() => onChange(o)}
          >
            <Text style={[chip.text, { color: value === o ? t.accent : t.chipText }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const hasFile = !!fileName;
  const hasImage = !!imageFileName;

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>

      {/* Input file HTML caché — web seulement */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.pdf"
          style={{ display: 'none' }}
          onChange={onWebFileChange}
        />
      )}

      {/* Input image HTML caché — web seulement */}
      {Platform.OS === 'web' && (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onWebImageChange}
        />
      )}

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[s.back, { color: t.textSub }]}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[s.title, { color: t.text }]}>Importer</Text>
          <Text style={[s.sub, { color: t.textSub }]}>
            Choisissez un fichier{' '}
            <Text style={{ color: t.accent, fontWeight: '800' }}>XLSX</Text> ou{' '}
            <Text style={{ color: t.accent, fontWeight: '800' }}>PDF</Text>,
            une image d'illustration, puis remplissez les infos et validez.
          </Text>
        </Animated.View>

        {/* Zone fichier */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={zoneAnim}>
          <TouchableOpacity
            style={[s.zone, {
              borderColor: hasFile ? t.accent : t.borderStrong,
              backgroundColor: hasFile ? t.accentBg : t.surface,
            }]}
            onPressIn={() => { zoneScale.value = withSpring(0.97); }}
            onPressOut={() => { zoneScale.value = withSpring(1); }}
            onPress={pickFile}
            activeOpacity={1}
          >
            <Animated.Text key={hasFile ? 'has' : 'no'} entering={ZoomIn.duration(250)} style={s.zoneIcon}>
              {hasFile ? '✅' : '📥'}
            </Animated.Text>
            <Text style={[s.zonePrimary, { color: t.text }]}>
              {fileName ?? 'Appuyer pour choisir un fichier'}
            </Text>
            <Text style={[s.zoneHint, { color: t.textMuted }]}>XLSX · XLS · PDF</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Zone image d'illustration */}
        <Animated.View entering={FadeInDown.delay(125).springify()} style={imageZoneAnim}>
          <TouchableOpacity
            style={[s.zone, {
              borderColor: hasImage ? t.accent : t.borderStrong,
              backgroundColor: hasImage ? t.accentBg : t.surface,
            }]}
            onPressIn={() => { imageZoneScale.value = withSpring(0.97); }}
            onPressOut={() => { imageZoneScale.value = withSpring(1); }}
            onPress={pickImage}
            activeOpacity={1}
          >
            <Animated.Text key={hasImage ? 'has' : 'no'} entering={ZoomIn.duration(250)} style={s.zoneIcon}>
              {hasImage ? '🖼️' : '📷'}
            </Animated.Text>
            <Text style={[s.zonePrimary, { color: t.text }]}>
              {imageFileName ?? 'Appuyer pour choisir une image d\'illustration'}
            </Text>
            <Text style={[s.zoneHint, { color: t.textMuted }]}>JPG · PNG · GIF · etc.</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Formulaire */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Code *</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="SAé 303" placeholderTextColor={t.textMuted}
            value={code} onChangeText={setCode} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Nom *</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="Conception de documents web" placeholderTextColor={t.textMuted}
            value={name} onChangeText={setName} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Année</Text>
          <ChipRow options={YEARS} value={year} onChange={setYear} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Semestre</Text>
          <ChipRow options={SEMS} value={semester} onChange={setSemester} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Domaine</Text>
          <ChipRow options={DOMAINS} value={domain} onChange={setDomain} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>UE</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="UE5.1" placeholderTextColor={t.textMuted}
            value={ue} onChangeText={setUe} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Description (optionnel)</Text>
          <TextInput
            style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border, height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
            placeholder="Objectifs, contexte…" placeholderTextColor={t.textMuted}
            value={desc} onChangeText={setDesc} multiline />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Compétences (optionnel)</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="Compétences visées" placeholderTextColor={t.textMuted}
            value={competences} onChangeText={setCompetences} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Date de début (optionnel)</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="YYYY-MM-DD" placeholderTextColor={t.textMuted}
            value={dateDebut} onChangeText={setDateDebut} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>Date de fin (optionnel)</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="YYYY-MM-DD" placeholderTextColor={t.textMuted}
            value={dateFin} onChangeText={setDateFin} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>URL du site (optionnel)</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="https://..." placeholderTextColor={t.textMuted}
            value={siteUrl} onChangeText={setSiteUrl} />

          <Text style={[s.fieldLabel, { color: t.textMuted }]}>URL du repo (optionnel)</Text>
          <TextInput style={[s.input, { backgroundColor: t.inputBg, color: t.text, borderColor: t.border }]}
            placeholder="https://github.com/..." placeholderTextColor={t.textMuted}
            value={repoUrl} onChangeText={setRepoUrl} />
        </Animated.View>

        {/* Erreur */}
        {error && (
          <Animated.View entering={FadeInDown.springify()}
            style={[s.errorBox, { backgroundColor: t.danger + '18', borderColor: t.danger + '55' }]}>
            <Text style={[s.errorText, { color: t.danger }]}>⚠️ {error}</Text>
          </Animated.View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: loading ? t.textMuted : t.accent }]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>Valider</Text>
          }
        </TouchableOpacity>

        {/* Résultat */}
        {result && (
          <Animated.View entering={FadeInDown.springify()}
            style={[s.resultBox, { backgroundColor: t.surface, borderColor: t.accent + '66' }]}>
            <Text style={[s.resultTitle, { color: t.text }]}>✅ {result.code} importée !</Text>
            <Text style={[s.resultSub, { color: t.textSub }]}>
              {result.groups.length} groupes · {result.stats.total} étudiants
            </Text>
            <TouchableOpacity
              style={[s.viewBtn, { borderColor: t.accent }]}
              onPress={() => router.push({ pathname: '/sae/[id]', params: { id: result.id } })}
            >
              <Text style={[s.viewBtnText, { color: t.accent }]}>Voir la SAé →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '600' },
});

const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { padding: 20 },
  back:    { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  title:   { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8 },
  sub:     { fontSize: 14, lineHeight: 21, marginBottom: 24 },
  zone:    { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, padding: 36, alignItems: 'center', gap: 10, marginBottom: 24 },
  zoneIcon:    { fontSize: 36 },
  zonePrimary: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  zoneHint:    { fontSize: 12 },
  fieldLabel:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:       { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, borderWidth: 1, marginBottom: 16 },
  errorBox:    { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 16 },
  errorText:   { fontSize: 13 },
  submitBtn:   { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  submitText:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  resultBox:   { borderRadius: 18, padding: 18, borderWidth: 1.5, gap: 8 },
  resultTitle: { fontSize: 17, fontWeight: '800' },
  resultSub:   { fontSize: 13 },
  viewBtn:     { borderRadius: 10, borderWidth: 1.5, padding: 12, alignItems: 'center', marginTop: 4 },
  viewBtnText: { fontSize: 14, fontWeight: '700' },
});