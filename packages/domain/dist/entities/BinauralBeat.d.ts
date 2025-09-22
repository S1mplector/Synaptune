import { Frequency } from '../value-objects/Frequency';
export declare const MIN_BEAT_FREQUENCY_HZ = 0.5;
export declare const MAX_BEAT_FREQUENCY_HZ = 40;
export interface BinauralBeatProps {
    left: Frequency;
    right: Frequency;
    createdAt?: Date;
}
export declare class BinauralBeat {
    readonly left: Frequency;
    readonly right: Frequency;
    readonly createdAt: Date;
    private constructor();
    static create(props: BinauralBeatProps): BinauralBeat;
    get beatFrequency(): number;
}
