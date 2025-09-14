export class Frequency {
  public readonly hz: number;

  private constructor(hz: number) {
    this.hz = hz;
  }

  static fromHz(hz: number): Frequency {
    if (!Number.isFinite(hz) || hz <= 0) {
      throw new Error('Frequency must be a positive finite number.');
    }
    return new Frequency(hz);
  }
}
