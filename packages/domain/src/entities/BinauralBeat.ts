import { Frequency } from '../value-objects/Frequency';

export const MIN_BEAT_FREQUENCY_HZ = 0.5;
export const MAX_BEAT_FREQUENCY_HZ = 40;

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
    // Frequency.fromHz already validates human-audible range; we rely on that upstream.
    const beatHz = Math.abs(props.left.hz - props.right.hz);
    if (beatHz < MIN_BEAT_FREQUENCY_HZ || beatHz > MAX_BEAT_FREQUENCY_HZ) {
      throw new Error(
        `Beat frequency must be within ${MIN_BEAT_FREQUENCY_HZ}-${MAX_BEAT_FREQUENCY_HZ} Hz (received ${beatHz}).`,
      );
    }
    return new BinauralBeat(props);
  }

  get beatFrequency(): number {
    return Math.abs(this.left.hz - this.right.hz);
  }
}
