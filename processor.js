class DataProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.data = [0];
    this.index = 0;
    this.phase = 0;
    this.running = false;
    this.detune = 2;

    this.port.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "data") {
        this.data = msg.data;
        this.index = 0;
      }

      if (msg.type === "start") {
        this.running = true;
        this.detune = Number(msg.detune);
      }

      if (msg.type === "stop") {
        this.running = false;
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1];

    for (let i = 0; i < left.length; i++) {

      if (!this.running || this.data.length === 0) {
        left[i] = right[i] = 0;
        continue;
      }

      const value = this.data[this.index % this.data.length];

      // --- DATA MAPPING STRATEGIES ---

      // Frequency
      const freq = 100 + (value / 255) * 8000;

      // Amplitude
      const amp = (value % 50) / 50;

      // Envelope duration (affects decay speed)
      const decay = 0.001 + (value % 100) / 1000;

      // Stereo position
      const pan = (value / 255) * 2 - 1;

      // Event density (skip some samples)
      const densityGate = value % 7 !== 0;

      let sample = 0;

      if (densityGate) {
        // Phase accumulation
        this.phase += freq / sampleRate;

        const s1 = Math.sin(2 * Math.PI * this.phase);
        const s2 = Math.sin(2 * Math.PI * (this.phase + this.detune / 1000));

        // Phase interference
        sample = (s1 + s2) * 0.5;

        // Apply amplitude
        sample *= amp;

        // crude decay
        sample *= Math.exp(-decay * i);
      }

      // Stereo spread
      left[i] = sample * (1 - Math.max(0, pan));
      right[i] = sample * (1 + Math.min(0, pan));

      this.index++;
    }

    return true;
  }
}

registerProcessor("data-processor", DataProcessor);
