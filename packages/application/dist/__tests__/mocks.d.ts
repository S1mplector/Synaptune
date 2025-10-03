import type { Session, SessionRepository } from '@simbeat/domain';
export declare class MockSessionRepository implements SessionRepository {
    private store;
    save(session: Session): Promise<void>;
    findById(id: string): Promise<Session | null>;
    list(): Promise<Session[]>;
    delete(id: string): Promise<void>;
    clear(): Promise<void>;
}
