export const MIN_BEAT_FREQUENCY_HZ = 0.5;
export const MAX_BEAT_FREQUENCY_HZ = 40;
export class BinauralBeat {
    left;
    right;
    createdAt;
    constructor(props) {
        this.left = props.left;
        this.right = props.right;
        this.createdAt = props.createdAt ?? new Date();
    }
    static create(props) {
        // Frequency.fromHz already validates human-audible range; we rely on that upstream.
        const beatHz = Math.abs(props.left.hz - props.right.hz);
        if (beatHz < MIN_BEAT_FREQUENCY_HZ || beatHz > MAX_BEAT_FREQUENCY_HZ) {
            throw new Error(`Beat frequency must be within ${MIN_BEAT_FREQUENCY_HZ}-${MAX_BEAT_FREQUENCY_HZ} Hz (received ${beatHz}).`);
        }
        return new BinauralBeat(props);
    }
    get beatFrequency() {
        return Math.abs(this.left.hz - this.right.hz);
    }
}
