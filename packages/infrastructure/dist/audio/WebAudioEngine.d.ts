import type { AudioEngine } from '@simbeat/application';
export declare class WebAudioEngine implements AudioEngine {
    private ctx;
    private leftOsc?;
    private rightOsc?;
    private leftGain?;
    private rightGain?;
    private merger?;
    private running;
    isRunning(): boolean;
    start(leftHz: number, rightHz: number): Promise<void>;
    stop(): Promise<void>;
}
