import type { AudioWaveformPreview } from '../backend/audioProcessing';

export interface WaveformPairElements {
  original: {
    canvas: HTMLCanvasElement;
    ruler: HTMLElement;
    scroll: HTMLElement;
  };
  processed: {
    canvas: HTMLCanvasElement;
    ruler: HTMLElement;
    scroll: HTMLElement;
  };
}

function computeRulerStep(totalMs: number): number {
  const steps = [100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000, 30000, 60000];
  for (const step of steps) {
    if (totalMs / step <= 12) {
      return step;
    }
  }
  return 120000;
}

function drawRuler(container: HTMLElement, canvasWidth: number, totalMs: number): void {
  container.innerHTML = '';
  if (totalMs <= 0 || canvasWidth <= 0) {
    container.style.width = '100%';
    return;
  }
  const pxPerMs = canvasWidth / totalMs;
  const step = computeRulerStep(totalMs);
  container.style.width = `${canvasWidth}px`;
  for (let t = 0; t <= totalMs; t += step) {
    const mark = document.createElement('div');
    mark.className = 'audio-editor__ruler-mark';
    mark.style.left = `${t * pxPerMs}px`;
    const seconds = t / 1000;
    const decimals = step >= 1000 ? 0 : 1;
    mark.innerHTML = `<span>${seconds.toFixed(decimals)}s</span>`;
    container.appendChild(mark);
  }
}

function drawWave(canvas: HTMLCanvasElement, data: AudioWaveformPreview | undefined, width: number, height: number): void {
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx || !data || data.peaks.length === 0) {
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
    return;
  }
  ctx.clearRect(0, 0, width, height);
  const mid = height / 2;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  const totalPeaks = data.peaks.length;
  const pxPerPeak = totalPeaks > 0 ? totalPeaks / width : 1;
  ctx.beginPath();
  for (let x = 0; x < width; x += 1) {
    const peakIndex = Math.floor(x * pxPerPeak);
    const amplitude = data.peaks[Math.min(totalPeaks - 1, Math.max(0, peakIndex))] ?? 0;
    const y = amplitude * (height / 2);
    ctx.moveTo(x + 0.5, mid - y);
    ctx.lineTo(x + 0.5, mid + y);
  }
  ctx.stroke();
}

export class WaveformPairRenderer {
  private zoom = 1;
  private height = 120;
  private sync = true;
  private referenceDuration = 1000;
  private original?: AudioWaveformPreview;
  private processed?: AudioWaveformPreview;
  private syncingScroll = false;

  constructor(private readonly elements: WaveformPairElements) {
    this.bindScrollSync();
  }

  public setZoom(zoom: number): void {
    this.zoom = Math.max(0.25, zoom);
    this.render();
  }

  public setHeight(height: number): void {
    this.height = Math.max(40, height);
    this.render();
  }

  public setSync(enabled: boolean): void {
    this.sync = enabled;
  }

  public setData(original?: AudioWaveformPreview, processed?: AudioWaveformPreview): void {
    this.original = original;
    this.processed = processed;
    const durations = [original?.durationMs ?? 0, processed?.durationMs ?? 0].filter((value) => value > 0);
    this.referenceDuration = durations.length > 0 ? Math.max(...durations) : 1000;
    this.render();
  }

  private getCanvasWidth(durationMs: number): number {
    const baseWidth = 640;
    const minWidth = 120;
    const ratio = this.referenceDuration > 0 ? durationMs / this.referenceDuration : 1;
    const effectiveRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
    return Math.max(minWidth, Math.round(baseWidth * this.zoom * effectiveRatio));
  }

  private render(): void {
    const originalWidth = this.original ? this.getCanvasWidth(this.original.durationMs) : 640;
    const processedWidth = this.processed ? this.getCanvasWidth(this.processed.durationMs) : 640;
    drawWave(this.elements.original.canvas, this.original, originalWidth, this.height);
    drawWave(this.elements.processed.canvas, this.processed, processedWidth, this.height);
    drawRuler(this.elements.original.ruler, originalWidth, this.original?.durationMs ?? 0);
    drawRuler(this.elements.processed.ruler, processedWidth, this.processed?.durationMs ?? 0);
    this.syncScrollWidths();
  }

  private syncScrollWidths(): void {
    this.elements.original.scroll.style.width = `${this.elements.original.canvas.width}px`;
    this.elements.processed.scroll.style.width = `${this.elements.processed.canvas.width}px`;
  }

  private bindScrollSync(): void {
    const applySync = (source: HTMLElement, target: HTMLElement) => {
      const sourceScrollable = source.scrollWidth - source.clientWidth;
      const targetScrollable = target.scrollWidth - target.clientWidth;
      if (sourceScrollable <= 0 || targetScrollable <= 0) {
        target.scrollLeft = 0;
        return;
      }
      const ratio = source.scrollLeft / sourceScrollable;
      target.scrollLeft = ratio * targetScrollable;
    };

    const onScroll = (source: HTMLElement, target: HTMLElement) => {
      source.addEventListener('scroll', () => {
        if (!this.sync || this.syncingScroll) {
          return;
        }
        this.syncingScroll = true;
        applySync(source, target);
        this.syncingScroll = false;
      });
    };

    onScroll(this.elements.original.scroll, this.elements.processed.scroll);
    onScroll(this.elements.processed.scroll, this.elements.original.scroll);
  }
}
