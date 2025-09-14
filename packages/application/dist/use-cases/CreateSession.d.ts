import { SessionRepository } from '@simbeat/domain';
import { CreateSessionRequest, SessionResponse } from '../dto/SessionDTO';
export interface CreateSessionDeps {
    sessionRepo: SessionRepository;
}
export declare function makeCreateSession({ sessionRepo }: CreateSessionDeps): (req: CreateSessionRequest) => Promise<SessionResponse>;
