export interface PresetDTO {
    name: string;
    leftHz: number;
    rightHz: number;
}
export declare function listPresets(): PresetDTO[];
