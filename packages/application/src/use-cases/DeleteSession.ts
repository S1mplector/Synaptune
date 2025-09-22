import type { SessionRepository } from '@simbeat/domain';

export interface DeleteSessionDeps {
  sessionRepo: SessionRepository;
}

export function makeDeleteSession({ sessionRepo }: DeleteSessionDeps) {
  return async function deleteSession(id: string): Promise<void> {
    await sessionRepo.delete(id);
  };
}
