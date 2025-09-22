import type { SessionRepository } from '@simbeat/domain';
import type { SessionResponse } from '../dto/SessionDTO';
export interface CreateSessionFromPresetRequest {
    id: string;
    label?: string;
    presetName: string;
}
export interface CreateSessionFromPresetDeps {
    sessionRepo: SessionRepository;
}
export declare function makeCreateSessionFromPreset({ sessionRepo }: CreateSessionFromPresetDeps): (req: CreateSessionFromPresetRequest) => Promise<SessionResponse>;
