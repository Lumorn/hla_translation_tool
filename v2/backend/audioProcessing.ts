import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import type { ProjectPaths } from './projectStore';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

export interface AudioWaveformPreview {
  durationMs: number;
  sampleRate: number;
  channels: number;
  peaks: number[];
}

export interface AudioEffectSettings {
  tempoRatio?: number;
  gainDb?: number;
  reverse?: boolean;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface AudioProcessingRequest {
  sourceFile: string;
  targetFile?: string;
  trimStartMs?: number;
  trimEndMs?: number;
  effects?: AudioEffectSettings;
  normalize?: boolean;
}

export interface AudioProcessingResult {
  outputFile: string;
  outputPath: string;
  durationMs: number;
  appliedSettings: Required<Pick<AudioProcessingRequest, 'trimStartMs' | 'trimEndMs' | 'effects' | 'normalize'>>;
}

interface AudioProbeInfo {
  durationMs: number;
  sampleRate: number;
  channels: number;
}

async function ensureAudioDirectory(paths: ProjectPaths): Promise<void> {
  await fs.mkdir(paths.audioDir, { recursive: true });
}

async function appendLog(paths: ProjectPaths, message: string): Promise<void> {
  const directory = path.dirname(paths.logFile);
  await fs.mkdir(directory, { recursive: true });
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await fs.appendFile(paths.logFile, line, 'utf8');
}

async function probeAudio(filePath: string): Promise<AudioProbeInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }
      const stream = metadata.streams?.find((entry) => entry.codec_type === 'audio');
      const durationRaw =
        typeof metadata.format?.duration === 'number'
          ? metadata.format.duration
          : typeof metadata.format?.duration === 'string'
          ? Number.parseFloat(metadata.format.duration)
          : typeof stream?.duration === 'number'
          ? stream.duration
          : typeof stream?.duration === 'string'
          ? Number.parseFloat(stream.duration)
          : undefined;
      const sampleRateRaw = stream?.sample_rate;
      const sampleRate =
        typeof sampleRateRaw === 'number'
          ? sampleRateRaw
          : typeof sampleRateRaw === 'string'
          ? Number.parseFloat(sampleRateRaw)
          : undefined;
      const channels = stream?.channels ?? 1;
      if (typeof durationRaw !== 'number' || Number.isNaN(durationRaw)) {
        reject(new Error('Die Audiodatei konnte nicht vermessen werden.'));
        return;
      }
      resolve({
        durationMs: Math.round(durationRaw * 1000),
        sampleRate: Number.isFinite(sampleRate ?? NaN) ? (sampleRate as number) : 44100,
        channels,
      });
    });
  });
}

function getDefaultTargetName(sourceFile: string): string {
  const parsed = path.parse(sourceFile);
  const suffix = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = parsed.ext || '.wav';
  return `${parsed.name}-edit-${suffix}${ext}`;
}

async function runFfmpegToBuffer(args: string[]): Promise<Buffer> {
  if (!ffmpegStatic) {
    throw new Error('Die FFmpeg-Binärdatei wurde nicht gefunden.');
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const binary = ffmpegStatic;
    if (!binary) {
      reject(new Error('Die FFmpeg-Binärdatei wurde nicht gefunden.'));
      return;
    }
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const stdout: Readable | null = child.stdout;
    const stderrStream: Readable | null = child.stderr;
    if (!stdout || !stderrStream) {
      child.kill();
      reject(new Error('FFmpeg konnte keine PCM-Daten liefern.'));
      return;
    }
    stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    stderrStream.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.once('error', (error: Error) => reject(error));
    child.once('close', (code: number | null) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`FFmpeg-Aufruf scheiterte (Code ${code ?? -1}): ${stderr}`));
      }
    });
  });
}

function buildTempoFilters(tempoRatio: number | undefined): string[] {
  if (!tempoRatio || Math.abs(tempoRatio - 1) < 0.001) {
    return [];
  }
  const filters: string[] = [];
  let remaining = tempoRatio;
  while (remaining > 2 || remaining < 0.5) {
    if (remaining > 2) {
      filters.push('atempo=2.0');
      remaining /= 2;
    } else {
      filters.push('atempo=0.5');
      remaining /= 0.5;
    }
  }
  filters.push(`atempo=${remaining.toFixed(3)}`);
  return filters;
}

export async function loadWaveformPreview(
  paths: ProjectPaths,
  fileName: string,
  options: { maxPeaks?: number; targetSampleRate?: number } = {}
): Promise<AudioWaveformPreview> {
  await ensureAudioDirectory(paths);
  const filePath = path.join(paths.audioDir, fileName);
  await fs.access(filePath);
  const probe = await probeAudio(filePath);
  const maxPeaks = options.maxPeaks ?? 2048;
  const targetSampleRate = options.targetSampleRate ?? 8000;
  const args = [
    '-hide_banner',
    '-i',
    filePath,
    '-ac',
    '1',
    '-filter:a',
    `aresample=${targetSampleRate}`,
    '-map',
    'a:0',
    '-f',
    'f32le',
    'pipe:1',
  ];
  const pcm = await runFfmpegToBuffer(args);
  const sampleCount = pcm.length / 4;
  const dataView = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const step = Math.max(1, Math.floor(sampleCount / maxPeaks));
  const peaks: number[] = [];
  for (let i = 0; i < sampleCount; i += step) {
    const end = Math.min(sampleCount, i + step);
    let peak = 0;
    for (let j = i; j < end; j += 1) {
      const value = dataView.getFloat32(j * 4, true);
      const abs = Math.abs(value);
      if (abs > peak) {
        peak = abs;
      }
    }
    peaks.push(Math.min(1, peak));
  }
  return {
    durationMs: probe.durationMs,
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    peaks,
  };
}

export async function processAudioClip(
  paths: ProjectPaths,
  request: AudioProcessingRequest
): Promise<AudioProcessingResult> {
  await ensureAudioDirectory(paths);
  const sourcePath = path.join(paths.audioDir, request.sourceFile);
  await fs.access(sourcePath);
  const targetName = request.targetFile ?? getDefaultTargetName(request.sourceFile);
  const targetPath = path.join(paths.audioDir, targetName);
  const trimStartSec = request.trimStartMs ? Math.max(0, request.trimStartMs) / 1000 : 0;
  let trimEndSec: number | undefined;
  if (typeof request.trimEndMs === 'number') {
    const rawEnd = Math.max(request.trimEndMs, 0) / 1000;
    if (rawEnd > trimStartSec) {
      trimEndSec = rawEnd;
    }
  }

  const filters: string[] = [];
  if (request.normalize) {
    filters.push('dynaudnorm');
  }
  if (request.effects) {
    const { gainDb, reverse, fadeInMs, fadeOutMs, tempoRatio } = request.effects;
    if (typeof gainDb === 'number' && Math.abs(gainDb) > 0.001) {
      filters.push(`volume=${gainDb}dB`);
    }
    buildTempoFilters(tempoRatio).forEach((filter) => filters.push(filter));
    if (reverse) {
      filters.push('areverse');
    }
    if (fadeInMs && fadeInMs > 0) {
      filters.push(`afade=t=in:st=0:d=${(fadeInMs / 1000).toFixed(3)}`);
    }
    if (fadeOutMs && fadeOutMs > 0) {
      const durationSec = trimEndSec ? trimEndSec - trimStartSec : undefined;
      if (durationSec && durationSec > 0) {
        const start = Math.max(0, durationSec - fadeOutMs / 1000);
        filters.push(`afade=t=out:st=${start.toFixed(3)}:d=${(fadeOutMs / 1000).toFixed(3)}`);
      } else {
        filters.push(`afade=t=out:st=0:d=${(fadeOutMs / 1000).toFixed(3)}`);
      }
    }
  }

  await new Promise<void>((resolve, reject) => {
    let command = ffmpeg(sourcePath).outputOptions('-y');
    if (trimStartSec > 0) {
      command = command.seekInput(trimStartSec);
    }
    if (typeof trimEndSec === 'number' && trimEndSec > trimStartSec) {
      command = command.duration(trimEndSec - trimStartSec);
    }
    if (filters.length > 0) {
      command = command.audioFilters(filters);
    }
    command = command.output(targetPath);
    command.on('end', () => resolve());
    command.on('error', (error) => reject(error));
    command.run();
  });

  const resultProbe = await probeAudio(targetPath);
  const outputDurationMs = resultProbe.durationMs;
  const applied: Required<Pick<AudioProcessingRequest, 'trimStartMs' | 'trimEndMs' | 'effects' | 'normalize'>> = {
    trimStartMs: request.trimStartMs ?? 0,
    trimEndMs:
      typeof request.trimEndMs === 'number'
        ? request.trimEndMs
        : Math.round((request.trimStartMs ?? 0) + outputDurationMs),
    effects: request.effects ?? {},
    normalize: Boolean(request.normalize),
  };
  await appendLog(
    paths,
    `Audio "${request.sourceFile}" wurde verarbeitet und als "${targetName}" gespeichert.`
  );
  return {
    outputFile: targetName,
    outputPath: targetPath,
    durationMs: resultProbe.durationMs,
    appliedSettings: applied,
  };
}

export async function duplicateForComparison(
  paths: ProjectPaths,
  sourceFile: string,
  label: string
): Promise<string> {
  await ensureAudioDirectory(paths);
  const sourcePath = path.join(paths.audioDir, sourceFile);
  await fs.access(sourcePath);
  const parsed = path.parse(sourceFile);
  const targetName = `${parsed.name}-${label}${parsed.ext || '.wav'}`;
  const targetPath = path.join(paths.audioDir, targetName);
  await fs.copyFile(sourcePath, targetPath);
  await appendLog(
    paths,
    `Audio "${sourceFile}" wurde als Vergleichsversion "${targetName}" dupliziert.`
  );
  return targetName;
}
