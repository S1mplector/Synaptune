import { Frequency } from '../value-objects/Frequency';
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
