import type { SessionRepository } from '@simbeat/domain';
export interface DeleteSessionDeps {
    sessionRepo: SessionRepository;
}
export declare function makeDeleteSession({ sessionRepo }: DeleteSessionDeps): (id: string) => Promise<void>;
