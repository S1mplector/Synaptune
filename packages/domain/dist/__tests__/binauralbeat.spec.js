import { describe, it, expect } from 'vitest';
import { BinauralBeat, MIN_BEAT_FREQUENCY_HZ, MAX_BEAT_FREQUENCY_HZ } from '../entities/BinauralBeat';
import { Frequency } from '../value-objects/Frequency';
describe('BinauralBeat', () => {
    it('computes beat frequency as absolute difference', () => {
        const left = Frequency.fromHz(440);
        const right = Frequency.fromHz(445);
        const beat = BinauralBeat.create({ left, right });
        expect(beat.beatFrequency).toBe(5);
    });
    it('throws if beat frequency below minimum', () => {
        const left = Frequency.fromHz(440);
        const right = Frequency.fromHz(440.2);
        expect(() => BinauralBeat.create({ left, right })).toThrow(new RegExp(`${MIN_BEAT_FREQUENCY_HZ}`));
    });
    it('throws if beat frequency above maximum', () => {
        const left = Frequency.fromHz(440);
        const right = Frequency.fromHz(500);
        expect(() => BinauralBeat.create({ left, right })).toThrow(new RegExp(`${MAX_BEAT_FREQUENCY_HZ}`));
    });
});
