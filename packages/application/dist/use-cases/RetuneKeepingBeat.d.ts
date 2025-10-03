import type { AudioEngine } from '../ports/AudioEngine';
export interface RetuneKeepingBeatRequest {
    centerHz: number;
    beatHz: number;
}
export interface RetuneKeepingBeatResponse {
    leftHz: number;
    rightHz: number;
}
export declare function computeLeftRightFromCenterBeat(req: RetuneKeepingBeatRequest): RetuneKeepingBeatResponse;
export declare function makeRetuneKeepingBeat(engine: AudioEngine): (req: RetuneKeepingBeatRequest) => RetuneKeepingBeatResponse;
