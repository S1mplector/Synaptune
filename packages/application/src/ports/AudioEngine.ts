export interface AudioEngine {
  start(leftHz: number, rightHz: number): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  setVolume(volume: number): void; // 0.0 - 1.0
  getVolume(): number;
}
