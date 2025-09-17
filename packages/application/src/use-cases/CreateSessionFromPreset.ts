import { PRESETS, Preset, BinauralBeat, Frequency } from '@simbeat/domain';
import type { SessionRepository } from '@simbeat/domain';
import type { SessionResponse } from '../dto/SessionDTO';

export interface CreateSessionFromPresetRequest {
  id: string;
  label?: string;
  presetName: string;
}

export interface CreateSessionFromPresetDeps {
  sessionRepo: SessionRepository;
}

export function makeCreateSessionFromPreset({ sessionRepo }: CreateSessionFromPresetDeps) {
  return async function createSessionFromPreset(req: CreateSessionFromPresetRequest): Promise<SessionResponse> {
    const preset = PRESETS.find((p: Preset) => p.name === req.presetName);
    if (!preset) {
      throw new Error(`Preset not found: ${req.presetName}`);
    }

    const beat = BinauralBeat.create({
      left: Frequency.fromHz(preset.left.hz),
      right: Frequency.fromHz(preset.right.hz),
    });

    const session = { id: req.id, label: req.label ?? preset.name, beat };
    await sessionRepo.save(session);

    return {
      id: session.id,
      label: session.label,
      leftHz: beat.left.hz,
      rightHz: beat.right.hz,
      beatHz: beat.beatFrequency,
      createdAt: new Date().toISOString(),
    };
  };
}
