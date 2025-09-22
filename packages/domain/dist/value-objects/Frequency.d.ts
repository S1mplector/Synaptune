export declare const MIN_FREQUENCY_HZ = 20;
export declare const MAX_FREQUENCY_HZ = 20000;
export declare class Frequency {
    readonly hz: number;
    private constructor();
    static fromHz(hz: number): Frequency;
}
