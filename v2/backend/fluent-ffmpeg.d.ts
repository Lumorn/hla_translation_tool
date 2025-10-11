declare module 'fluent-ffmpeg' {
  export interface FfprobeStream {
    codec_type?: string;
    channels?: number;
    sample_rate?: number | string;
    duration?: number | string;
    [key: string]: unknown;
  }

  export interface FfprobeData {
    streams?: FfprobeStream[];
    format?: { duration?: number | string };
    [key: string]: unknown;
  }

  export type FfprobeCallback = (error: Error | null, metadata: FfprobeData) => void;

  export interface FfmpegCommand {
    input: (file: string) => FfmpegCommand;
    output: (file: string) => FfmpegCommand;
    audioCodec: (codec: string) => FfmpegCommand;
    format: (format: string) => FfmpegCommand;
    complexFilter: (filters: string[]) => FfmpegCommand;
    outputOptions: (options: string | string[]) => FfmpegCommand;
    audioFilters: (filters: string | string[]) => FfmpegCommand;
    seekInput: (seconds: number) => FfmpegCommand;
    duration: (seconds: number) => FfmpegCommand;
    on: (event: string, handler: (...args: unknown[]) => void) => FfmpegCommand;
    run: () => void;
  }

  export interface FfmpegStatic {
    (input?: string): FfmpegCommand;
    ffprobe: (file: string, callback: FfprobeCallback) => void;
    setFfmpegPath: (path: string) => void;
    setFfprobePath: (path: string) => void;
  }

  const ffmpeg: FfmpegStatic;
  export default ffmpeg;
}
