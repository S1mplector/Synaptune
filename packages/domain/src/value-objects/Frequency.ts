export const MIN_FREQUENCY_HZ = 20;
export const MAX_FREQUENCY_HZ = 20000;

export class Frequency {
  public readonly hz: number;

  private constructor(hz: number) {
    this.hz = hz;
  }

  static fromHz(hz: number): Frequency {
    if (!Number.isFinite(hz)) {
      throw new Error('Frequency must be a finite number.');
    }
    if (hz < MIN_FREQUENCY_HZ || hz > MAX_FREQUENCY_HZ) {
      throw new Error(
        `Frequency must be within ${MIN_FREQUENCY_HZ}-${MAX_FREQUENCY_HZ} Hz (received ${hz}).`,
      );
    }
    return new Frequency(hz);
  }
}
