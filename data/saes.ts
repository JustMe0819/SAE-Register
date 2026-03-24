// ────────────────────────────────────────────────────────────────────────────
// types
// ────────────────────────────────────────────────────────────────────────────
export interface SAEGroup {
  id: string;
  members: string[];     // noms complets
  grade: number | null;  // null = absent (CAN) ou non noté
}

export interface SAE {
  id: string;
  code: string;          // ex: "SAé 303"
  name: string;          // ex: "Intégration web"
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
// helpers
// ────────────────────────────────────────────────────────────────────────────
function gradeValue(raw: string | number | null): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw).trim().toUpperCase();
  if (s === 'CAN' || s === '' || s === 'ABI') return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

/** Group individual rows by identical grade (same grade = same group) */
function groupByGrade(rows: { name: string; grade: number | null; rawGrade: any }[]): SAEGroup[] {
  const map = new Map<string, string[]>();

  for (const row of rows) {
    // Use raw grade string as group key (handles CAN, None separately per person)
    const key = row.rawGrade === null || row.rawGrade === undefined
      ? `__null_${row.name}`  // no grade = individual bucket
      : String(row.rawGrade);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row.name);
  }

  let idx = 0;
  const groups: SAEGroup[] = [];
  for (const [key, members] of map.entries()) {
    const rawGrade = key.startsWith('__null_') ? null : key;
    groups.push({
      id: `g${idx++}`,
      members,
      grade: gradeValue(rawGrade),
    });
  }
  return groups;
}

// ────────────────────────────────────────────────────────────────────────────
// SAE 303 data  (Nom + Note — extracted from Groupes_SAE_303.xlsx)
// Format: col A = "Nom Prénom" together, col B = note or "CAN"
// ────────────────────────────────────────────────────────────────────────────
const RAW_303: [string, any][] = [
  ['ADJAOUD Rayane', 13.75],
  ['HUANG Patrick', 11.75],
  ['NIEWIDZIALA-BECKER Zoran', 11.75],
  ['LOUBARESSE Victor', 13],
  ['LUFUNDU Océane', 9.75],
  ['BOREL Maïlys', 9.25],
  ['MONNERAT Maxime', 10.5],
  ['DA COSTA Timéo', 17],
  ['GADAGNI Soumiyya', 17.25],
  ['JANVIER Charly', 17],
  ['TREFFAULT Axel', 17],
  ['MORANCY Manon', 5.25],
  ['ONESTAS Radji', 5.25],
  ['MAUDET Dylan', 5.25],
  ['MOYEUX Dorian', 5.25],
  ['GÜNDEM Enes', 15.25],
  ['PICARD-ALVAREZ Erwan', 15.5],
  ['ROBERT Lucas', 15.25],
  ['ABDI Enzo', 17.75],
  ['CORPET Kilian', 13.25],
  ['THEVIN Alexis', 13],
  ['LACHAB Imène', 14.25],
  ['GERANCE Lény', 14.75],
  ['PARADIS Jérémy', 10.25],
  ['GIROUX Benjamin', 10.25],
  ['SAIDJ Sofiane', 14],
  ['YO KING CHUEN Darel', 10.25],
  ['REDOT Naël', 10.25],
  ['LAUDET Mathieu', 15],
  ['JOUAN Gregoire', 14.75],
  ['GOSMAT Adam', 14.5],
  ['FARRUGGIA Maxime', 14.5],
  ['DERENNES Maxime', 17.75],
  ['KERGASTEL Témi', 'CAN'],
  ['TOCQUEVILLE Joachim', 12.5],
  ['CHISIU Sébastien', 16.25],
  ['DRAME Ibrahim', 13],
  ['CHOUDJAY Dylan', 11.5],
  ['SAVOURIN Thomas', 11.75],
  ['GUIDDIR Naïm', 11.25],
  ['CHUPIN Nathan', 11],
  ['COSTE Maxence', 16.25],
  ['RABARIJAONA Samuel', 15.75],
  ['GUESNON Clément', 5],
  ['DELEN Corentin', 15.75],
  ['SAMOURA Diaba', 15.75],
  ['ADMI Séfora', 11],
  ['GILET Amel', 15.5],
  ['LEBRETON Laura', 14],
  ['LUYEYE POLYDOR Nelly', 10.5],
  ['BOULLARD Raphaël', 14.5],
  ['KADI Wassim', 11.5],
  ['SIMON-JEAN Leana', 11.5],
  ['MARTON Eliot', 11.5],
  ['FLEURY Noa', 14],
  ['ANDOUARD Liam', 13.25],
  ['BOUQUET Ethan', 14.25],
  ['JEULAND Enzo', 13.25],
  ['TRELLE Florian', 13.25],
];

// ────────────────────────────────────────────────────────────────────────────
// SAE 501 data  (Nom + Prénom séparés + Note — extracted from Groupes_SAE_501.xlsx)
// ────────────────────────────────────────────────────────────────────────────
const RAW_501: [string, string, any][] = [
  ['BEN BOUBAKER', 'Sheinez', 10.05],
  ['BAL', 'Zeinabou', 13.05],
  ['HOUNSOU', 'Markhus', 12.3],
  ['MHOUMADI', 'Makine', 10.8],
  ['BUHOT', 'Yanis', 12],
  ['CHAPUT', 'Théo', 12.375],
  ['HAMON', 'Alexandre', 13.125],
  ['VANDELET', 'Marin', 15],
  ['CHTIOUI', 'Ibtissem', 13.45],
  ['GONCALVES', 'Hugo Vitor', 11.7],
  ['PEREIRA', 'Ruben', 11.7],
  ['MAHJOUB', 'Assia', 10.7],
  ['KONATE', 'Hamed', 10.65],
  ['KECKET-BAKER', 'Trystan', 10.4],
  ['MANSOIBOU', 'Warrick', 10.4],
  ['CHEURFA', 'Liam', 15.05],
  ['BRUSA', 'Joris', 11.3],
  ['CARPENTIER', 'Timothé', 13.05],
  ['MONLAY', 'Tom', null],
  ['ZAIEM', 'Sarah', 12.75],
  ['BROUILLARD', 'Thylia', 11.75],
  ['BUISSET', 'Nicolas', 15.25],
  ['HENRIQUES MATEUS', 'Léonardo', null],
  ['THIABAS HOULAI', 'Keyla', 10.95],
  ['EDDABACHI', 'Younes', 10.45],
  ['KOUASSI', 'Emmanuel', 11.7],
  ['PEREZ SANCHEZ', 'John', 12.2],
  ['THEVAKUMAR', 'Aathavan', 15.55],
  ['VIGNESWARAN', 'Abi', 11.8],
  ['SALAOUDINE', 'Saffana', 13.8],
  ['BAER', 'Oscar', 12.55],
  ['LAWSON', 'Killian', 13.275],
  ['VEOPRASEUTH', 'Nolan', 10.9],
  ['ZENATI', 'Mehdi', 12.65],
  ['PREVOST', 'Adrien', 14.15],
  ['VASANTHAN', 'Luxchan', 11.55],
  ['KRISHNAKUMAR', 'Abeeschan', 12.8],
  ['ANTUNES', 'Enzo', 10.8],
  ['RANNOU', 'Nicolas', 10.3],
  ['BALDINETTI', 'Mattéo', 15.95],
  ['DINH', 'Ken', 18.7],
  ['ROURE', 'Vincent', 15.45],
  ['SEGHIRI', 'Marwan', 13.45],
  ['CAMELIN', 'Yannis', 14.05],
  ['RAKOTOMAVO', 'Mathias', 13.8],
  ['SOM', 'Yohan', 15.175],
  ['LOPERE', 'Alexandre', 13.55],
];

// ────────────────────────────────────────────────────────────────────────────
// Build SAE objects
// ────────────────────────────────────────────────────────────────────────────
const groups303 = groupByGrade(
  RAW_303.map(([name, grade]) => ({ name, grade: gradeValue(grade), rawGrade: grade }))
);

const groups501 = groupByGrade(
  RAW_501.map(([nom, prenom, grade]) => ({
    name: `${nom} ${prenom}`.trim(),
    grade: gradeValue(grade),
    rawGrade: grade,
  }))
);

export const SAE_DATA: SAE[] = [
  {
    id: 'sae303',
    code: 'SAé 303',
    name: 'Conception de documents web',
    year: 'MMI2',
    semester: 3,
    domain: 'Web',
    ue: 'UE3.1',
    groups: groups303,
    description: 'Création et intégration de documents web en équipe, avec focus sur accessibilité et les standards W3C.',
  },
  {
    id: 'sae501',
    code: 'SAé 501',
    name: 'Projet transversal (TXLFORMA)',
    year: 'MMI3',
    semester: 5,
    domain: 'Web',
    ue: 'UE5.1',
    groups: groups501,
    description: 'Projet transversal intégrant design, développement et communication autour d\'une thématique imposée.',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers to query data
// ────────────────────────────────────────────────────────────────────────────

/** All groups across all SAé, flattened with SAé info */
export function allGroups(): Array<SAEGroup & { sae: SAE }> {
  return SAE_DATA.flatMap((sae) =>
    sae.groups.map((g) => ({ ...g, sae }))
  );
}

/** Find which SAé group a student belongs to */
export function findStudent(query: string): Array<{ group: SAEGroup; sae: SAE }> {
  const q = query.toLowerCase();
  return SAE_DATA.flatMap((sae) =>
    sae.groups
      .filter((g) => g.members.some((m) => m.toLowerCase().includes(q)))
      .map((g) => ({ group: g, sae }))
  );
}

/** Stats for a SAé */
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

/** All unique domains across SAé */
export const ALL_DOMAINS = [...new Set(SAE_DATA.map((s) => s.domain))];