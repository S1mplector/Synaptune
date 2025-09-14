import type { AudioEngine } from '../ports/AudioEngine';

export interface StartPlaybackRequest {
  leftHz: number;
  rightHz: number;
}

export function makeStartPlayback(engine: AudioEngine) {
  return async function startPlayback(req: StartPlaybackRequest): Promise<void> {
    await engine.start(req.leftHz, req.rightHz);
  };
}
