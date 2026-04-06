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

export type Theme = typeof dark;

export function useTheme(): Theme {
  return dark;
}