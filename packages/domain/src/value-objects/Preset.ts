import { Frequency } from './Frequency';
import { BinauralBeat } from '../entities/BinauralBeat';

export interface PresetProps {
  name: string;
  leftHz: number;
  rightHz: number;
}

export class Preset {
  public readonly name: string;
  public readonly left: Frequency;
  public readonly right: Frequency;

  private constructor(props: { name: string; left: Frequency; right: Frequency }) {
    this.name = props.name;
    this.left = props.left;
    this.right = props.right;
  }

  static create(props: PresetProps): Preset {
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
