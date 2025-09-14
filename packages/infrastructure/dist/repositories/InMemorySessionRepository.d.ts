import { Session, SessionRepository } from '@simbeat/domain';
export declare class InMemorySessionRepository implements SessionRepository {
    private store;
    save(session: Session): Promise<void>;
    findById(id: string): Promise<Session | null>;
    list(): Promise<Session[]>;
}
