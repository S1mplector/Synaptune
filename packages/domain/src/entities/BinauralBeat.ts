import { Frequency } from '../value-objects/Frequency';

export interface BinauralBeatProps {
  left: Frequency;
  right: Frequency;
  createdAt?: Date;
}

export class BinauralBeat {
  public readonly left: Frequency;
  public readonly right: Frequency;
  public readonly createdAt: Date;

  private constructor(props: BinauralBeatProps) {
    this.left = props.left;
    this.right = props.right;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: BinauralBeatProps): BinauralBeat {
    if (props.left.hz <= 0 || props.right.hz <= 0) {
      throw new Error('Frequencies must be positive.');
    }
    return new BinauralBeat(props);
  }

  get beatFrequency(): number {
    return Math.abs(this.left.hz - this.right.hz);
  }
}
