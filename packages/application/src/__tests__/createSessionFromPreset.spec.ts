import { describe, it, expect } from 'vitest';
import { makeCreateSessionFromPreset } from '../use-cases/CreateSessionFromPreset';
import { MockSessionRepository } from './mocks';
import { PRESETS } from '@simbeat/domain';

describe('makeCreateSessionFromPreset', () => {
  it('creates a session from an existing preset', async () => {
    const repo = new MockSessionRepository();
    const createFromPreset = makeCreateSessionFromPreset({ sessionRepo: repo });

    const preset = PRESETS[0];
    const res = await createFromPreset({ id: 'p1', presetName: preset.name });

    expect(res.id).toBe('p1');
    expect(res.label).toBe(preset.name);
    expect(res.leftHz).toBeCloseTo(preset.left.hz);
    expect(res.rightHz).toBeCloseTo(preset.right.hz);
    expect(res.beatHz).toBeCloseTo(Math.abs(preset.left.hz - preset.right.hz));

    const saved = await repo.findById('p1');
    expect(saved).not.toBeNull();
    expect(saved!.label).toBe(preset.name);
    expect(saved!.beat.left.hz).toBeCloseTo(preset.left.hz);
  });
});
