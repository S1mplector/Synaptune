import type { SessionRepository } from '@simbeat/domain';
export interface ClearSessionsDeps {
    sessionRepo: SessionRepository;
}
export declare function makeClearSessions({ sessionRepo }: ClearSessionsDeps): () => Promise<void>;
