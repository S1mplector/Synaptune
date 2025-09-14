export interface AudioEngine {
  start(leftHz: number, rightHz: number): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}
