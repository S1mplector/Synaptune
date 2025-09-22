export interface AudioEngine {
  start(leftHz: number, rightHz: number): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  setVolume(volume: number): void; // 0.0 - 1.0
  getVolume(): number;
  updateFrequencies(leftHz: number, rightHz: number): void; // smooth retuning while running
  setPan(pan: number): void; // -1.0 (left) to 1.0 (right)
  getPan(): number;
  subscribe(listener: (state: { running: boolean; volume: number; pan: number }) => void): () => void;
}
