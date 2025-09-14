import type { AudioEngine } from '../ports/AudioEngine';
export interface StartPlaybackRequest {
    leftHz: number;
    rightHz: number;
}
export declare function makeStartPlayback(engine: AudioEngine): (req: StartPlaybackRequest) => Promise<void>;
