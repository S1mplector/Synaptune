export class WebAudioEngine {
    ctx = null;
    leftOsc;
    rightOsc;
    leftGain;
    rightGain;
    merger;
    masterGain;
    panner;
    running = false;
    volume = 0.5; // 0..1
    pan = 0; // -1..1 (left..right)
    listeners = new Set();
    notify() {
        const snapshot = { running: this.running, volume: this.volume, pan: this.pan };
        this.listeners.forEach((fn) => {
            try {
                fn(snapshot);
            }
            catch { }
        });
    }
    isRunning() {
        return this.running;
    }
    async start(leftHz, rightHz) {
        if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
            throw new Error('Web Audio API is not available in this environment.');
        }
        if (!this.ctx) {
            const Ctx = (window.AudioContext || window.webkitAudioContext);
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
        // Master volume
        this.masterGain = new GainNode(ctx, { gain: 0 });
        this.panner = new StereoPannerNode(ctx, { pan: this.pan });
        this.merger.connect(this.masterGain).connect(this.panner).connect(ctx.destination);
        this.leftOsc.start();
        this.rightOsc.start();
        // Smooth fade-in to target volume
        const now = ctx.currentTime;
        const target = Math.max(0, Math.min(1, this.volume));
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(target, now + 0.05);
        this.running = true;
        this.notify();
    }
    async stop() {
        if (!this.ctx)
            return;
        try {
            // Smooth fade-out before stopping oscillators
            if (this.masterGain) {
                const now = this.ctx.currentTime;
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
                this.masterGain.gain.linearRampToValueAtTime(0, now + 0.05);
                // wait for fade-out
                await new Promise((r) => setTimeout(r, 60));
            }
            if (this.leftOsc) {
                this.leftOsc.stop();
                this.leftOsc.disconnect();
            }
            if (this.rightOsc) {
                this.rightOsc.stop();
                this.rightOsc.disconnect();
            }
            if (this.leftGain)
                this.leftGain.disconnect();
            if (this.rightGain)
                this.rightGain.disconnect();
            if (this.merger)
                this.merger.disconnect();
            if (this.masterGain)
                this.masterGain.disconnect();
            if (this.panner)
                this.panner.disconnect();
        }
        catch {
            // ignore cleanup errors
        }
        this.leftOsc = undefined;
        this.rightOsc = undefined;
        this.leftGain = undefined;
        this.rightGain = undefined;
        this.merger = undefined;
        this.masterGain = undefined;
        this.panner = undefined;
        this.running = false;
        this.notify();
    }
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
        }
        this.notify();
    }
    getVolume() {
        return this.volume;
    }
    updateFrequencies(leftHz, rightHz) {
        if (!this.ctx)
            return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        if (this.leftOsc) {
            this.leftOsc.frequency.cancelScheduledValues(now);
            this.leftOsc.frequency.setValueAtTime(this.leftOsc.frequency.value, now);
            this.leftOsc.frequency.linearRampToValueAtTime(leftHz, now + 0.05);
        }
        if (this.rightOsc) {
            this.rightOsc.frequency.cancelScheduledValues(now);
            this.rightOsc.frequency.setValueAtTime(this.rightOsc.frequency.value, now);
            this.rightOsc.frequency.linearRampToValueAtTime(rightHz, now + 0.05);
        }
    }
    subscribe(listener) {
        this.listeners.add(listener);
        // push initial
        try {
            listener({ running: this.running, volume: this.volume, pan: this.pan });
        }
        catch { }
        return () => {
            this.listeners.delete(listener);
        };
    }
    setPan(pan) {
        this.pan = Math.max(-1, Math.min(1, pan));
        if (this.panner && this.ctx) {
            const now = this.ctx.currentTime;
            this.panner.pan.cancelScheduledValues(now);
            this.panner.pan.setValueAtTime(this.panner.pan.value, now);
            this.panner.pan.linearRampToValueAtTime(this.pan, now + 0.05);
        }
        this.notify();
    }
    getPan() {
        return this.pan;
    }
}
