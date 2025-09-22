import type { SessionRepository } from '@simbeat/domain';

export interface ClearSessionsDeps {
  sessionRepo: SessionRepository;
}

export function makeClearSessions({ sessionRepo }: ClearSessionsDeps) {
  return async function clearSessions(): Promise<void> {
    await sessionRepo.clear();
  };
}
