import { BinauralBeat } from '@simbeat/domain/entities/BinauralBeat';
import { Frequency } from '@simbeat/domain/value-objects/Frequency';
import { SessionRepository } from '@simbeat/domain/repositories/SessionRepository';
import { CreateSessionRequest, SessionResponse } from '../dto/SessionDTO';

export interface CreateSessionDeps {
  sessionRepo: SessionRepository;
}

export function makeCreateSession({ sessionRepo }: CreateSessionDeps) {
  return async function createSession(req: CreateSessionRequest): Promise<SessionResponse> {
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
