class DataProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.data = [128]; // default so it ALWAYS makes sound
    this.index = 0;
    this.phase = 0;
    this.running = false;

    this.port.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "data") {
        this.data = msg.data.length ? msg.data : [128];
        this.index = 0;
      }

      if (msg.type === "start") {
        this.running = true;
      }

      if (msg.type === "stop") {
        this.running = false;
      }
    };
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const left = out[0];
    const right = out[1];

    for (let i = 0; i < left.length; i++) {

      if (!this.running) {
        left[i] = right[i] = 0;
        continue;
      }

      const value = this.data[this.index % this.data.length];

      // --- DATA MAPPING ---

      const freq = 200 + (value / 255) * 3000;
      const amp = (value / 255) * 0.3;

      // phase advance
      this.phase += freq / sampleRate;

      // interference (detuned oscillator)
      const s1 = Math.sin(2 * Math.PI * this.phase);
      const s2 = Math.sin(2 * Math.PI * (this.phase * 1.01));

      let sample = (s1 + s2) * 0.5;

      sample *= amp;

      // stereo from data
      const pan = value / 255;

      left[i] = sample * (1 - pan);
      right[i] = sample * pan;

      this.index++;
    }

    return true;
  }
}

registerProcessor("data-processor", DataProcessor);
