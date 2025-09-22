import type { SessionRepository } from '@simbeat/domain';
import type { SessionResponse } from '../dto/SessionDTO';
export interface ListSessionsDeps {
    sessionRepo: SessionRepository;
}
export declare function makeListSessions({ sessionRepo }: ListSessionsDeps): () => Promise<SessionResponse[]>;
