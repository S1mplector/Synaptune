import type { AudioEngine } from '@simbeat/application';
export declare class WebAudioEngine implements AudioEngine {
    private ctx;
    private leftOsc?;
    private rightOsc?;
    private leftGain?;
    private rightGain?;
    private merger?;
    private masterGain?;
    private panner?;
    private running;
    private volume;
    private pan;
    private listeners;
    private notify;
    isRunning(): boolean;
    start(leftHz: number, rightHz: number): Promise<void>;
    stop(): Promise<void>;
    setVolume(volume: number): void;
    getVolume(): number;
    updateFrequencies(leftHz: number, rightHz: number): void;
    subscribe(listener: (state: {
        running: boolean;
        volume: number;
        pan: number;
    }) => void): () => void;
    setPan(pan: number): void;
    getPan(): number;
}
