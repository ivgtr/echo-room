import type { BreakerId } from '../game/domain/ids';

const frequencies: Record<BreakerId, number> = {
  breaker_1: 330,
  breaker_2: 660,
  breaker_3: 220,
  breaker_4: 440,
};

let audioContext: AudioContext | null = null;

export const unlockAudio = async () => {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') await audioContext.resume();
};

export const playBreakerTone = (
  breakerId: BreakerId,
  enabled: boolean,
  volume = 100,
) => {
  if (!enabled || !audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequencies[breakerId];
  oscillator.type = 'sine';
  gain.gain.setValueAtTime(0.08 * (volume / 100), audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.24,
  );
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.25);
};
