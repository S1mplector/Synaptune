import { PRESETS, BinauralBeat, Frequency } from '@simbeat/domain';
export function makeCreateSessionFromPreset({ sessionRepo }) {
    return async function createSessionFromPreset(req) {
        const preset = PRESETS.find((p) => p.name === req.presetName);
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
