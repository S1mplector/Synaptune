export interface AudioEngine {
    start(leftHz: number, rightHz: number): Promise<void>;
    stop(): Promise<void>;
    isRunning(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    updateFrequencies(leftHz: number, rightHz: number): void;
    setPan(pan: number): void;
    getPan(): number;
    subscribe(listener: (state: {
        running: boolean;
        volume: number;
        pan: number;
    }) => void): () => void;
}
