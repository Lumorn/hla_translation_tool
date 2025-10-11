/**
 * Minimales Segmentmodell, das für Statistiken benötigt wird.
 */
export interface ProjectSegmentLike {
  id?: string;
  text?: string;
  translation?: string;
  audio?: string;
  status?: string;
  notes?: unknown;
  note?: unknown;
  [key: string]: unknown;
}

/**
 * Minimales Datenmodell eines Projekts.
 */
export interface ProjectDataLike {
  segments?: ProjectSegmentLike[];
  [key: string]: unknown;
}

/**
 * Kennzahlen für ein Projekt basierend auf Segmentdaten.
 */
export interface ProjectStats {
  totalSegments: number;
  translatedSegments: number;
  audioSegments: number;
  completedSegments: number;
  translationPercent: number;
  audioPercent: number;
  completedPercent: number;
  pendingReviewSegments: number;
  statusCounts: Record<string, number>;
  noteCounts: Record<string, number>;
}

/**
 * Fortschrittsinformationen, die in der Projektübersicht gespeichert werden.
 */
export interface ProjectProgressSnapshot {
  totalSegments: number;
  translatedSegments: number;
  audioSegments: number;
  completedSegments: number;
  translationPercent: number;
  audioPercent: number;
  completedPercent: number;
  pendingReviewSegments: number;
  rating: number;
  statusCounts: Record<string, number>;
  noteCounts: Record<string, number>;
  notesTotal: number;
  updatedAt: string;
}

function isSegmentTranslated(segment: ProjectSegmentLike): boolean {
  if (typeof segment.translation === 'string' && segment.translation.trim().length > 0) {
    return true;
  }
  const status = typeof segment.status === 'string' ? segment.status.trim().toLowerCase() : '';
  return status === 'translated' || status === 'approved' || status === 'final' || status === 'done';
}

function isSegmentCompleted(segment: ProjectSegmentLike): boolean {
  const status = typeof segment.status === 'string' ? segment.status.trim().toLowerCase() : '';
  if (status === 'approved' || status === 'final' || status === 'done' || status === 'released') {
    return true;
  }
  if (!isSegmentTranslated(segment)) {
    return false;
  }
  if (typeof segment.audio === 'string' && segment.audio.trim().length > 0) {
    return true;
  }
  return false;
}

function extractNotes(segment: ProjectSegmentLike): string[] {
  const raw = (segment as { notes?: unknown; note?: unknown }).notes ?? (segment as { note?: unknown }).note;
  if (typeof raw === 'string') {
    return raw
      .split(/[;,]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }
  return [];
}

function normaliseSegments(data?: ProjectDataLike): ProjectSegmentLike[] {
  if (!data || !Array.isArray(data.segments)) {
    return [];
  }
  return data.segments.filter((segment): segment is ProjectSegmentLike => Boolean(segment && typeof segment === 'object'));
}

/**
 * Berechnet Statistiken auf Basis des Segmentinhalts eines Projekts.
 */
export function calculateProjectStats(data?: ProjectDataLike): ProjectStats {
  const segments = normaliseSegments(data);
  const totalSegments = segments.length;

  if (totalSegments === 0) {
    return {
      totalSegments: 0,
      translatedSegments: 0,
      audioSegments: 0,
      completedSegments: 0,
      translationPercent: 0,
      audioPercent: 0,
      completedPercent: 0,
      pendingReviewSegments: 0,
      statusCounts: {},
      noteCounts: {},
    };
  }

  let translatedSegments = 0;
  let audioSegments = 0;
  let completedSegments = 0;
  let pendingReviewSegments = 0;

  const statusCounts: Record<string, number> = {};
  const noteCounts: Record<string, number> = {};

  for (const segment of segments) {
    if (isSegmentTranslated(segment)) {
      translatedSegments += 1;
    }

    if (typeof segment.audio === 'string' && segment.audio.trim().length > 0) {
      audioSegments += 1;
    }

    if (isSegmentCompleted(segment)) {
      completedSegments += 1;
    }

    const status = typeof segment.status === 'string' ? segment.status.trim().toLowerCase() : '';
    if (status) {
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      if (status === 'review' || status === 'reviewing' || status === 'needs-review') {
        pendingReviewSegments += 1;
      }
    }

    const notes = extractNotes(segment);
    for (const note of notes) {
      const key = note.toLowerCase();
      noteCounts[key] = (noteCounts[key] ?? 0) + 1;
    }
  }

  const translationPercent = Math.round((translatedSegments / totalSegments) * 100);
  const audioPercent = Math.round((audioSegments / totalSegments) * 100);
  const completedPercent = Math.round((completedSegments / totalSegments) * 100);

  return {
    totalSegments,
    translatedSegments,
    audioSegments,
    completedSegments,
    translationPercent,
    audioPercent,
    completedPercent,
    pendingReviewSegments,
    statusCounts,
    noteCounts,
  };
}

/**
 * Ermittelt eine Bewertungsskala von 0 bis 5 basierend auf der Fertigstellung.
 */
export function deriveRatingFromStats(stats: ProjectStats): number {
  if (stats.totalSegments === 0) {
    return 0;
  }

  if (stats.completedPercent >= 95) {
    return 5;
  }
  if (stats.completedPercent >= 80) {
    return 4;
  }
  if (stats.completedPercent >= 60) {
    return 3;
  }
  if (stats.completedPercent >= 35) {
    return 2;
  }
  if (stats.completedPercent > 0) {
    return 1;
  }
  return 0;
}

/**
 * Erstellt einen Fortschrittsschnappschuss aus den berechneten Statistiken.
 */
export function buildProgressSnapshot(
  stats: ProjectStats,
  previous?: Partial<ProjectProgressSnapshot>
): ProjectProgressSnapshot {
  const rating = typeof previous?.rating === 'number' ? previous.rating : deriveRatingFromStats(stats);
  const notesTotal = Object.values(stats.noteCounts).reduce((sum, value) => sum + value, 0);

  return {
    totalSegments: stats.totalSegments,
    translatedSegments: stats.translatedSegments,
    audioSegments: stats.audioSegments,
    completedSegments: stats.completedSegments,
    translationPercent: stats.translationPercent,
    audioPercent: stats.audioPercent,
    completedPercent: stats.completedPercent,
    pendingReviewSegments: stats.pendingReviewSegments,
    rating,
    statusCounts: { ...stats.statusCounts },
    noteCounts: { ...stats.noteCounts },
    notesTotal,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Kombiniert zwei Statistikobjekte, indem Summen gebildet werden.
 */
export function mergeProjectStats(left: ProjectStats, right: ProjectStats): ProjectStats {
  const totalSegments = left.totalSegments + right.totalSegments;
  const translatedSegments = left.translatedSegments + right.translatedSegments;
  const audioSegments = left.audioSegments + right.audioSegments;
  const completedSegments = left.completedSegments + right.completedSegments;
  const pendingReviewSegments = left.pendingReviewSegments + right.pendingReviewSegments;

  const statusCounts: Record<string, number> = { ...left.statusCounts };
  for (const [status, count] of Object.entries(right.statusCounts)) {
    statusCounts[status] = (statusCounts[status] ?? 0) + count;
  }

  const noteCounts: Record<string, number> = { ...left.noteCounts };
  for (const [note, count] of Object.entries(right.noteCounts)) {
    noteCounts[note] = (noteCounts[note] ?? 0) + count;
  }

  if (totalSegments === 0) {
    return {
      totalSegments,
      translatedSegments,
      audioSegments,
      completedSegments,
      translationPercent: 0,
      audioPercent: 0,
      completedPercent: 0,
      pendingReviewSegments,
      statusCounts,
      noteCounts,
    };
  }

  return {
    totalSegments,
    translatedSegments,
    audioSegments,
    completedSegments,
    translationPercent: Math.round((translatedSegments / totalSegments) * 100),
    audioPercent: Math.round((audioSegments / totalSegments) * 100),
    completedPercent: Math.round((completedSegments / totalSegments) * 100),
    pendingReviewSegments,
    statusCounts,
    noteCounts,
  };
}

/**
 * Erstellt ein leeres Statistikobjekt.
 */
export function createEmptyStats(): ProjectStats {
  return {
    totalSegments: 0,
    translatedSegments: 0,
    audioSegments: 0,
    completedSegments: 0,
    translationPercent: 0,
    audioPercent: 0,
    completedPercent: 0,
    pendingReviewSegments: 0,
    statusCounts: {},
    noteCounts: {},
  };
}
