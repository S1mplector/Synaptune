import type { Session, SessionRepository } from '@simbeat/domain';
export declare class LocalStorageSessionRepository implements SessionRepository {
    private get storage();
    private read;
    private write;
    save(session: Session): Promise<void>;
    findById(id: string): Promise<Session | null>;
    list(): Promise<Session[]>;
}
