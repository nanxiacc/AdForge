import fs from "node:fs";

/**
 * Tiny offline music bed generator.
 * A soft pad + sub bass, no samples and no API calls, mixed well under the VO.
 */

const SR = 44100;

const PROGRESSIONS: Record<string, number[][]> = {
  // Am7 - Fmaj7 - Cmaj7 - G
  warm: [
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [130.81, 164.81, 196.0, 246.94],
    [196.0, 246.94, 293.66, 392.0],
  ],
  // Cmaj7 - Am7 - Fmaj7 - G
  bright: [
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 392.0],
  ],
};

function writeWav(path: string, left: Float32Array, right: Float32Array) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  fs.writeFileSync(path, buf);
}

export function buildMusicBed(
  duration: number,
  path: string,
  mood: "warm" | "bright" = "warm",
) {
  const total = Math.ceil(duration * SR);
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  const progression = PROGRESSIONS[mood] ?? PROGRESSIONS.warm;
  const bar = 4.0; // seconds per chord

  for (let i = 0; i < total; i++) {
    const t = i / SR;
    const barIndex = Math.floor(t / bar) % progression.length;
    const chord = progression[barIndex];
    const local = t % bar;
    const env = Math.min(1, local / 0.9) * Math.min(1, (bar - local) / 0.9);

    let l = 0;
    let r = 0;
    for (let v = 0; v < chord.length; v++) {
      const f = chord[v];
      const amp = 0.11 / (1 + v * 0.35);
      // two slightly detuned sines create a gentle chorus
      l += Math.sin(2 * Math.PI * f * t) * amp * env;
      r += Math.sin(2 * Math.PI * (f * 1.002) * t + 0.6) * amp * env;
    }
    // sub bass, one octave below the root
    const bass = Math.sin(2 * Math.PI * (chord[0] / 2) * t) * 0.09 * env;
    // slow airy swell
    const air =
      Math.sin(2 * Math.PI * 523.25 * t + Math.sin(t * 0.4) * 2) *
      0.012 *
      env *
      (0.5 + 0.5 * Math.sin(t * 0.7));

    l += bass + air;
    r += bass * 0.95 + air;

    // master fade in / out
    const fadeIn = Math.min(1, t / 1.2);
    const fadeOut = Math.min(1, (duration - t) / 2.0);
    const master = Math.max(0, Math.min(fadeIn, fadeOut));
    left[i] = Math.tanh(l * 1.4) * 0.55 * master;
    right[i] = Math.tanh(r * 1.4) * 0.55 * master;
  }

  writeWav(path, left, right);
  return path;
}
