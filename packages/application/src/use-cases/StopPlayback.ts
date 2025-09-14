import type { AudioEngine } from '../ports/AudioEngine';

export function makeStopPlayback(engine: AudioEngine) {
  return async function stopPlayback(): Promise<void> {
    await engine.stop();
  };
}
