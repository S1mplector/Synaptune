import { Frequency } from './Frequency';
import { BinauralBeat } from '../entities/BinauralBeat';
export class Preset {
    name;
    left;
    right;
    constructor(props) {
        this.name = props.name;
        this.left = props.left;
        this.right = props.right;
    }
    static create(props) {
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('Preset name must be provided.');
        }
        const left = Frequency.fromHz(props.leftHz);
        const right = Frequency.fromHz(props.rightHz);
        // Validate beat via BinauralBeat
        BinauralBeat.create({ left, right });
        return new Preset({ name: props.name.trim(), left, right });
    }
}
