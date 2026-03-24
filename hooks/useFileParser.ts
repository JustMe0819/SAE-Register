/**
 * parseFileToGroups
 *
 * Reads a XLSX or PDF file and returns structured groups.
 *
 * Supported XLSX formats:
 *   A) 2 cols: "Nom" (nom+prénom ensemble) | "Note"          → SAé 303 style
 *   B) 3 cols: "Nom" | "Prénom" | "Note"                     → SAé 501 style
 *   C) Any order — columns are detected by header keyword
 *
 * Notes can be numeric, "CAN", empty → null
 * Students with the same note are assumed to be in the same group.
 */

import * as FileSystem from 'expo-file-system';
import type { SAEGroup } from '../data/saes';

// ─────────────────────────────────────────────────────────────────────────────

function normalize(s: any): string {
  return String(s ?? '').replace(/\xa0/g, ' ').trim();
}

function parseGrade(raw: any): number | null {
  if (raw === null || raw === undefined) return null;
  const s = normalize(raw).toUpperCase();
  if (s === '' || s === 'CAN' || s === 'ABI' || s === 'ABJ') return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

function buildGroups(rows: { fullName: string; rawGrade: any }[]): SAEGroup[] {
  // Group by raw grade string — same raw value = same group
  const buckets = new Map<string, string[]>();
  for (const { fullName, rawGrade } of rows) {
    if (!fullName) continue;
    // Students with null grade get individual buckets (can't infer group)
    const key =
      rawGrade === null || rawGrade === undefined || normalize(rawGrade) === ''
        ? `__nograde_${fullName}`
        : normalize(String(rawGrade));
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(fullName);
  }

  let idx = 0;
  return Array.from(buckets.entries()).map(([key, members]) => ({
    id: `import_g${idx++}`,
    members,
    grade: key.startsWith('__nograde_') ? null : parseGrade(key),
  }));
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

export async function parseXLSX(uri: string): Promise<SAEGroup[]> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });

  const XLSX = require('xlsx');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const wb = XLSX.read(bytes, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
    defval: null,
    raw: true,
  });

  if (raw.length === 0) throw new Error('Le fichier est vide.');

  // Detect columns
  const firstRow = raw[0];
  const keys = Object.keys(firstRow);

  const colNom    = keys.find((k) => /^nom$/i.test(normalize(k)));
  const colPrenom = keys.find((k) => /^pr[eé]nom$/i.test(normalize(k)));
  const colNote   = keys.find((k) => /^note|grade|score|résultat/i.test(normalize(k)));

  if (!colNote) throw new Error('Colonne "Note" introuvable. Vérifiez les en-têtes.');
  if (!colNom) throw new Error('Colonne "Nom" introuvable.');

  const rows = raw.map((row) => {
    const nom    = normalize(row[colNom!]);
    const prenom = colPrenom ? normalize(row[colPrenom]) : '';
    const fullName = colPrenom && prenom
      ? `${nom} ${prenom}`.trim()
      : nom;
    return { fullName, rawGrade: row[colNote!] };
  }).filter((r) => r.fullName);

  return buildGroups(rows);
}

// ─── PDF (text layer only) ────────────────────────────────────────────────────

export async function parsePDF(uri: string): Promise<SAEGroup[]> {
  let text: string;
  try {
    text = await FileSystem.readAsStringAsync(uri, {
      encoding: 'utf8' as any,
    });
  } catch {
    throw new Error(
      'Ce PDF ne contient pas de couche texte lisible. Utilisez le format XLSX pour de meilleurs résultats.'
    );
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const rows: { fullName: string; rawGrade: any }[] = [];

  for (const line of lines) {
    // Skip header lines
    if (/^(nom|pr[eé]nom|note|score)/i.test(line)) continue;

    // Pattern A: "DUPONT Jean 15.5"  or  "DUPONT Jean  CAN"
    const matchA = line.match(/^(.+?)\s+([\d.,]+|CAN|ABI)$/i);
    if (matchA) {
      rows.push({ fullName: normalize(matchA[1]), rawGrade: normalize(matchA[2]) });
      continue;
    }

    // Pattern B: "DUPONT Jean 15,75" with comma
    const matchB = line.match(/^(.+?)\s+(\d{1,2}[,.]?\d*)$/);
    if (matchB) {
      rows.push({ fullName: normalize(matchB[1]), rawGrade: normalize(matchB[2]) });
    }
  }

  if (rows.length === 0) {
    throw new Error(
      'Aucun étudiant détecté. Le PDF doit contenir une ligne par étudiant avec son nom et sa note.'
    );
  }

  return buildGroups(rows);
}