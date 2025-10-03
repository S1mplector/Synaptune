import { BinauralBeat, Frequency } from '@simbeat/domain';
export function computeLeftRightFromCenterBeat(req) {
    const { centerHz, beatHz } = req;
    const leftHz = centerHz - beatHz / 2;
    const rightHz = centerHz + beatHz / 2;
    // Validate using domain rules
    const left = Frequency.fromHz(leftHz);
    const right = Frequency.fromHz(rightHz);
    BinauralBeat.create({ left, right });
    return { leftHz: left.hz, rightHz: right.hz };
}
export function makeRetuneKeepingBeat(engine) {
    return function retuneKeepingBeat(req) {
        const { leftHz, rightHz } = computeLeftRightFromCenterBeat(req);
        // Smoothly retune the running engine if applicable
        try {
            engine.updateFrequencies(leftHz, rightHz);
        }
        catch {
            // ignore if engine not ready
        }
        return { leftHz, rightHz };
    };
}
