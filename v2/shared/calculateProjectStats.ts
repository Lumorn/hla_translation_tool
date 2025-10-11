/**
 * Berechnet Projektstatistiken für Segmentdaten.
 * Kommentare sind bewusst auf Deutsch gehalten.
 */

export interface ProjectSegmentLike {
  id?: string;
  text?: string | null;
  translation?: string | null;
  audio?: string | null | boolean;
  status?: string | number | null;
  score?: number | null;
  [key: string]: unknown;
}

export interface ProjectDataLike {
  segments?: ProjectSegmentLike[] | null;
  [key: string]: unknown;
}

export interface ProjectStatistics {
  enPercent: number;
  dePercent: number;
  audioPercent: number;
  completedPercent: number;
  scoreAverage: number;
  scoreMinimum: number;
  totalSegments: number;
}

export interface ProjectStatsOptions {
  isSegmentCompleted?: (segment: ProjectSegmentLike) => boolean;
  hasAudio?: (segment: ProjectSegmentLike) => boolean;
  extractScore?: (segment: ProjectSegmentLike) => number | undefined;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function defaultHasAudio(segment: ProjectSegmentLike): boolean {
  if (!segment) {
    return false;
  }

  const directAudio = segment.audio;
  if (typeof directAudio === 'string') {
    return directAudio.trim().length > 0;
  }

  if (typeof directAudio === 'boolean') {
    return directAudio;
  }

  const altAudio = (segment as { audioPath?: string | null; audioUrl?: string | null }).audioPath
    ?? (segment as { audioPath?: string | null; audioUrl?: string | null }).audioUrl;
  if (typeof altAudio === 'string') {
    return altAudio.trim().length > 0;
  }

  return false;
}

function defaultIsCompleted(segment: ProjectSegmentLike): boolean {
  return hasText(segment?.text) && hasText(segment?.translation) && defaultHasAudio(segment);
}

function defaultExtractScore(segment: ProjectSegmentLike): number | undefined {
  if (!segment) {
    return undefined;
  }

  if (typeof segment.score === 'number' && Number.isFinite(segment.score)) {
    return segment.score;
  }

  const status = segment.status;
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status;
  }

  if (typeof status === 'string') {
    const numeric = Number(status.trim());
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return undefined;
}

export function calculateProjectStats(
  project: ProjectDataLike | undefined,
  options: ProjectStatsOptions = {},
): ProjectStatistics {
  const segments = Array.isArray(project?.segments) ? project!.segments!.filter(Boolean) : [];
  const totalSegments = segments.length;

  if (totalSegments === 0) {
    return {
      enPercent: 0,
      dePercent: 0,
      audioPercent: 0,
      completedPercent: 0,
      scoreAverage: 0,
      scoreMinimum: 0,
      totalSegments: 0,
    };
  }

  const audioCheck = options.hasAudio ?? defaultHasAudio;
  const completionCheck = options.isSegmentCompleted ?? defaultIsCompleted;
  const scoreExtractor = options.extractScore ?? defaultExtractScore;

  let englishCount = 0;
  let germanCount = 0;
  let audioCount = 0;
  let completedCount = 0;
  const scores: number[] = [];

  for (const segment of segments) {
    if (hasText(segment?.text)) {
      englishCount += 1;
    }
    if (hasText(segment?.translation)) {
      germanCount += 1;
    }
    if (audioCheck(segment)) {
      audioCount += 1;
    }
    if (completionCheck(segment)) {
      completedCount += 1;
    }

    const score = scoreExtractor(segment);
    if (typeof score === 'number' && Number.isFinite(score)) {
      scores.push(score);
    }
  }

  const enPercent = Math.round((englishCount / totalSegments) * 100);
  const dePercent = Math.round((germanCount / totalSegments) * 100);
  const audioPercent = Math.round((audioCount / totalSegments) * 100);
  const completedPercent = Math.round((completedCount / totalSegments) * 100);

  let scoreAverage = 0;
  let scoreMinimum = 0;
  if (scores.length > 0) {
    scoreAverage = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    scoreMinimum = scores.reduce((min, value) => (value < min ? value : min), scores[0]);
  }

  return {
    enPercent,
    dePercent,
    audioPercent,
    completedPercent,
    scoreAverage,
    scoreMinimum,
    totalSegments,
  };
}

export default calculateProjectStats;
