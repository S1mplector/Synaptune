export class Frequency {
    hz;
    constructor(hz) {
        this.hz = hz;
    }
    static fromHz(hz) {
        if (!Number.isFinite(hz) || hz <= 0) {
            throw new Error('Frequency must be a positive finite number.');
        }
        return new Frequency(hz);
    }
}
