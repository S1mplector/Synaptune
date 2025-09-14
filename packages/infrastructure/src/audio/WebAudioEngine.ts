import type { AudioEngine } from '@simbeat/application';

export class WebAudioEngine implements AudioEngine {
  private ctx: AudioContext | null = null;
  private leftOsc?: OscillatorNode;
  private rightOsc?: OscillatorNode;
  private leftGain?: GainNode;
  private rightGain?: GainNode;
  private merger?: ChannelMergerNode;
  private running = false;

  isRunning(): boolean {
    return this.running;
  }

  async start(leftHz: number, rightHz: number): Promise<void> {
    if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
      throw new Error('Web Audio API is not available in this environment.');
    }

    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      this.ctx = new Ctx();
    }

    // Resume if suspended (required by some browsers on user gesture)
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Clean any existing graph
    await this.stop();

    const ctx = this.ctx;

    // Create oscillators
    this.leftOsc = new OscillatorNode(ctx, { type: 'sine', frequency: leftHz });
    this.rightOsc = new OscillatorNode(ctx, { type: 'sine', frequency: rightHz });

    // Gains (volume control, keep moderate level)
    this.leftGain = new GainNode(ctx, { gain: 0.05 });
    this.rightGain = new GainNode(ctx, { gain: 0.05 });

    // Merge into stereo channels: 0 -> left, 1 -> right
    this.merger = new ChannelMergerNode(ctx, { numberOfInputs: 2 });

    this.leftOsc.connect(this.leftGain).connect(this.merger, 0, 0);
    this.rightOsc.connect(this.rightGain).connect(this.merger, 0, 1);

    this.merger.connect(ctx.destination);

    this.leftOsc.start();
    this.rightOsc.start();

    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.ctx) return;

    try {
      if (this.leftOsc) {
        this.leftOsc.stop();
        this.leftOsc.disconnect();
      }
      if (this.rightOsc) {
        this.rightOsc.stop();
        this.rightOsc.disconnect();
      }
      if (this.leftGain) this.leftGain.disconnect();
      if (this.rightGain) this.rightGain.disconnect();
      if (this.merger) this.merger.disconnect();
    } catch {
      // ignore cleanup errors
    }

    this.leftOsc = undefined;
    this.rightOsc = undefined;
    this.leftGain = undefined;
    this.rightGain = undefined;
    this.merger = undefined;

    this.running = false;
  }
}
