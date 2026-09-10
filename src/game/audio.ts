// 本地合成轻声响，不使用原作音频，不需要联网。
type Sound = "tap" | "bag" | "letter" | "harvest";
let context: AudioContext | null = null,
  ambient: AudioBufferSourceNode | null = null,
  ambientGain: GainNode | null = null;
let enabled = false;
function audioContext() {
  if (!context) context = new AudioContext();
  return context;
}
function noise(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * seconds),
      ctx.sampleRate,
    ),
    data = buffer.getChannelData(0);
  let smooth = 0;
  for (let i = 0; i < data.length; i++) {
    smooth = (smooth + (Math.random() * 2 - 1) * 0.04) / 1.02;
    data[i] = smooth * 3;
  }
  return buffer;
}
export async function enableAudio(value: boolean) {
  enabled = value;
  if (!value) {
    ambient?.stop();
    ambient = null;
    ambientGain?.disconnect();
    ambientGain = null;
    return;
  }
  try {
    const ctx = audioContext();
    await ctx.resume();
    if (!enabled || ambient) return;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = noise(ctx, 8);
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 700;
    gain.gain.value = 0.045;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    ambient = source;
    ambientGain = gain;
  } catch {
    /* 浏览器不支持音频时，游戏保持静音可用。 */
  }
}
export function playSound(sound: Sound) {
  if (!enabled) return;
  try {
    const ctx = audioContext();
    if (ctx.state !== "running") {
      void ctx.resume();
      return;
    }
    const at = ctx.currentTime;
    if (sound === "harvest") {
      for (const [i, freq] of [523.25, 659.25, 783.99].entries()) {
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = freq;
        gain.gain.setValueAtTime(0, at + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.035, at + i * 0.09 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, at + i * 0.09 + 0.28);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(at + i * 0.09);
        oscillator.stop(at + i * 0.09 + 0.3);
      }
    } else {
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        gain = ctx.createGain();
      source.buffer = noise(ctx, 0.18);
      filter.type = "bandpass";
      filter.frequency.value =
        sound === "bag" ? 420 : sound === "letter" ? 1900 : 900;
      gain.gain.setValueAtTime(0.2, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      source.stop(at + 0.18);
    }
  } catch {
    /* 音频失败不能打断收成或存档。 */
  }
}
