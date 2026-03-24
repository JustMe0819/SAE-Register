import { useColorScheme } from 'react-native';

// ── Domain palette ──────────────────────────────────────────────────────────
export const DOMAIN_META: Record<string, { color: string; icon: string }> = {
  Web:    { color: '#E8613A', icon: '🌐' },
  Design: { color: '#9B72CF', icon: '🎨' },
  '3D':   { color: '#2CB67D', icon: '🧊' },
  DI:     { color: '#F4A261', icon: '⚡' },
  Audio:  { color: '#4EA8DE', icon: '🎙️' },
  Vidéo:  { color: '#E76F51', icon: '🎬' },
  Autre:  { color: '#6B7280', icon: '📁' },
};

// ── Dark theme ───────────────────────────────────────────────────────────────
const dark = {
  isDark: true,
  bg:            '#0B0D14',
  surface:       '#13161F',
  surfaceHigh:   '#1C2030',
  border:        'rgba(255,255,255,0.06)',
  borderStrong:  'rgba(255,255,255,0.12)',
  text:          '#EBE9F4',
  textSub:       '#7B7F9A',
  textMuted:     '#3D4159',
  accent:        '#E8613A',
  accentBg:      'rgba(232,97,58,0.15)',
  gradient:      ['#0B0D14', '#13161F'] as string[],
  tabBar:        '#0F1118',
  tabBarBorder:  'rgba(255,255,255,0.06)',
  inputBg:       '#1C2030',
  chipBg:        '#1C2030',
  chipText:      '#7B7F9A',
  chipActive:    'rgba(232,97,58,0.18)',
  chipActiveBorder: '#E8613A',
  chipActiveText:   '#E8613A',
  success:       '#2CB67D',
  warning:       '#F4A261',
  danger:        '#E05252',
};

// ── Light theme ──────────────────────────────────────────────────────────────
const light = {
  isDark: false,
  bg:            '#F2F1ED',
  surface:       '#FFFFFF',
  surfaceHigh:   '#E9E7E0',
  border:        'rgba(0,0,0,0.07)',
  borderStrong:  'rgba(0,0,0,0.14)',
  text:          '#1A1826',
  textSub:       '#5A576E',
  textMuted:     '#B0AEBF',
  accent:        '#C8501E',
  accentBg:      'rgba(200,80,30,0.1)',
  gradient:      ['#E9E7E0', '#F2F1ED'] as string[],
  tabBar:        '#FFFFFF',
  tabBarBorder:  'rgba(0,0,0,0.07)',
  inputBg:       '#E9E7E0',
  chipBg:        '#E9E7E0',
  chipText:      '#5A576E',
  chipActive:    'rgba(200,80,30,0.12)',
  chipActiveBorder: '#C8501E',
  chipActiveText:   '#C8501E',
  success:       '#1E8C5A',
  warning:       '#C47A1A',
  danger:        '#C03030',
};

export type Theme = typeof dark;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}