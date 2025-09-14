import { BinauralBeat, Frequency } from '@simbeat/domain';
export function makeCreateSession({ sessionRepo }) {
    return async function createSession(req) {
        const beat = BinauralBeat.create({
            left: Frequency.fromHz(req.leftHz),
            right: Frequency.fromHz(req.rightHz),
        });
        const session = { id: req.id, label: req.label, beat };
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
