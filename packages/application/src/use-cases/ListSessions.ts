import type { SessionRepository } from '@simbeat/domain';
import type { SessionResponse } from '../dto/SessionDTO';

export interface ListSessionsDeps {
  sessionRepo: SessionRepository;
}

export function makeListSessions({ sessionRepo }: ListSessionsDeps) {
  return async function listSessions(): Promise<SessionResponse[]> {
    const sessions = await sessionRepo.list();
    return sessions.map((s) => ({
      id: s.id,
      label: s.label,
      leftHz: s.beat.left.hz,
      rightHz: s.beat.right.hz,
      beatHz: s.beat.beatFrequency,
      createdAt: s.beat.createdAt.toISOString(),
    }));
  };
}
