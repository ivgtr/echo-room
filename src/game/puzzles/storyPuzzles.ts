import { BREAKER_ORDER, type BreakerId } from '../domain/ids';

export const isCorrectBreakerSequence = (sequence: readonly BreakerId[]) =>
  sequence.length === BREAKER_ORDER.length &&
  sequence.every((id, index) => id === BREAKER_ORDER[index]);

export const isLockerCodeCorrect = (answer: string) => answer === '0237';

export const FINAL_PACKET_ORDER = [
  'audio_packet_01',
  'audio_packet_02',
  'audio_packet_03',
  'audio_packet_04',
] as const;
export type PacketId = (typeof FINAL_PACKET_ORDER)[number];

export const isFinalPacketOrderCorrect = (answer: readonly string[]) =>
  answer.length === FINAL_PACKET_ORDER.length &&
  answer.every((id, index) => id === FINAL_PACKET_ORDER[index]);
