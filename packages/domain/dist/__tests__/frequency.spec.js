import { describe, it, expect } from 'vitest';
import { Frequency, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ } from '../value-objects/Frequency';
describe('Frequency', () => {
    it('creates for values within audible range', () => {
        const f1 = Frequency.fromHz(MIN_FREQUENCY_HZ);
        const f2 = Frequency.fromHz(440);
        const f3 = Frequency.fromHz(MAX_FREQUENCY_HZ);
        expect(f1.hz).toBe(MIN_FREQUENCY_HZ);
        expect(f2.hz).toBe(440);
        expect(f3.hz).toBe(MAX_FREQUENCY_HZ);
    });
    it('throws for non-finite values', () => {
        expect(() => Frequency.fromHz(NaN)).toThrowError();
        expect(() => Frequency.fromHz(Infinity)).toThrowError();
        expect(() => Frequency.fromHz(-Infinity)).toThrowError();
    });
    it('throws for values outside audible range', () => {
        expect(() => Frequency.fromHz(MIN_FREQUENCY_HZ - 0.1)).toThrowError();
        expect(() => Frequency.fromHz(MAX_FREQUENCY_HZ + 1)).toThrowError();
    });
});
