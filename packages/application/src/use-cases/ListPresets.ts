import { PRESETS, Preset } from '@simbeat/domain';

export interface PresetDTO {
  name: string;
  leftHz: number;
  rightHz: number;
}

export function listPresets(): PresetDTO[] {
  return PRESETS.map((p: Preset) => ({ name: p.name, leftHz: p.left.hz, rightHz: p.right.hz }));
}
