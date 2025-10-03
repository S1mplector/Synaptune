import { describe, it, expect } from 'vitest';
import { makeCreateSession } from '../use-cases/CreateSession';
import { MockSessionRepository } from './mocks';
import { Frequency, BinauralBeat } from '@simbeat/domain';
describe('makeCreateSession', () => {
    it('creates and saves a session, computing beat frequency', async () => {
        const repo = new MockSessionRepository();
        const createSession = makeCreateSession({ sessionRepo: repo });
        const res = await createSession({ id: 's1', label: 'Test', leftHz: 220, rightHz: 225 });
        expect(res.id).toBe('s1');
        expect(res.label).toBe('Test');
        expect(res.leftHz).toBe(220);
        expect(res.rightHz).toBe(225);
        expect(res.beatHz).toBe(5);
        const saved = await repo.findById('s1');
        expect(saved).not.toBeNull();
        expect(saved.label).toBe('Test');
        expect(saved.beat.beatFrequency).toBe(5);
        // sanity: domain constructs properly
        const bb = BinauralBeat.create({ left: Frequency.fromHz(res.leftHz), right: Frequency.fromHz(res.rightHz) });
        expect(bb.beatFrequency).toBe(5);
    });
});
