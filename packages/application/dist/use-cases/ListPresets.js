import { PRESETS } from '@simbeat/domain';
export function listPresets() {
    return PRESETS.map((p) => ({ name: p.name, leftHz: p.left.hz, rightHz: p.right.hz }));
}
