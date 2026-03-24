// ────────────────────────────────────────────────────────────────────────────
// types
// ────────────────────────────────────────────────────────────────────────────
export interface SAEGroup {
  id: string;
  members: string[];
  grade: number | null;
}

export interface SAE {
  id: string;
  code: string;
  name: string;
  year: 'MMI2' | 'MMI3';
  semester: number;
  domain: string;
  ue: string;
  groups: SAEGroup[];
  siteUrl?: string;
  repoUrl?: string;
  description?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// données — vides par défaut, à remplir via import
// ────────────────────────────────────────────────────────────────────────────
export const SAE_DATA: SAE[] = [];

// ────────────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────────────

export function allGroups(): Array<SAEGroup & { sae: SAE }> {
  return SAE_DATA.flatMap((sae) =>
    sae.groups.map((g) => ({ ...g, sae }))
  );
}

export function findStudent(query: string): Array<{ group: SAEGroup; sae: SAE }> {
  const q = query.toLowerCase();
  return SAE_DATA.flatMap((sae) =>
    sae.groups
      .filter((g) => g.members.some((m) => m.toLowerCase().includes(q)))
      .map((g) => ({ group: g, sae }))
  );
}

export function saeStats(sae: SAE) {
  const grades = sae.groups
    .flatMap((g) => g.members.map(() => g.grade))
    .filter((g): g is number => g !== null);

  if (grades.length === 0) return { avg: null, min: null, max: null, total: 0, graded: 0 };
  const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
  return {
    avg: Math.round(avg * 100) / 100,
    min: Math.min(...grades),
    max: Math.max(...grades),
    total: sae.groups.reduce((a, g) => a + g.members.length, 0),
    graded: grades.length,
  };
}

export const ALL_DOMAINS = [...new Set(SAE_DATA.map((s) => s.domain))];