import { Frequency } from './Frequency';
export interface PresetProps {
    name: string;
    leftHz: number;
    rightHz: number;
}
export declare class Preset {
    readonly name: string;
    readonly left: Frequency;
    readonly right: Frequency;
    private constructor();
    static create(props: PresetProps): Preset;
}
