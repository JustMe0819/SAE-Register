export interface GroupDTO {
  id: number;
  grade: number | null;
  members: string[];
}

export interface StatsDTO {
  total: number;
  graded: number;
  avg: number | null;
  min: number | null;
  max: number | null;
}

export interface SaeDTO {
  id: number;
  code: string;
  name: string;
  year: 'MMI2' | 'MMI3';
  semester: number;
  domain: string;
  ue: string;
  description: string | null;
  competences: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  siteUrl: string | null;
  repoUrl: string | null;
  tauxReussite: number | null;
  groups: GroupDTO[];
  stats: StatsDTO;
}
