import { Preset } from '../value-objects/Preset';

export const PRESETS: ReadonlyArray<Preset> = [
  Preset.create({ name: 'Focus (10 Hz)', leftHz: 220, rightHz: 230 }),
  Preset.create({ name: 'Relax (6 Hz)', leftHz: 200, rightHz: 206 }),
  Preset.create({ name: 'Sleep (2 Hz)', leftHz: 180, rightHz: 182 }),
  Preset.create({ name: 'Meditation (7.83 Hz)', leftHz: 200, rightHz: 207.83 }),
];
