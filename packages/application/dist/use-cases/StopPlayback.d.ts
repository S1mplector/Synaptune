import type { AudioEngine } from '../ports/AudioEngine';
export declare function makeStopPlayback(engine: AudioEngine): () => Promise<void>;
