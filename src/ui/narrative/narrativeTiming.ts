import type { TextSpeed } from '../system/uiSettings';

export const CHARACTER_INTERVAL_MS: Record<TextSpeed, number> = {
  slow: 72,
  normal: 44,
  fast: 24,
};

export function shouldPlayTextBlip(character: string, index: number) {
  return index % 2 === 1 && !/[\s、。！？…―,.!?]/u.test(character);
}

export function getCharacterDelay(speed: TextSpeed, character: string) {
  const base = CHARACTER_INTERVAL_MS[speed];
  if (/[。！？.!?]/u.test(character)) return base * 5;
  if (/[、,]/u.test(character)) return base * 3;
  if (/[……―]/u.test(character)) return base * 2;
  return base;
}
