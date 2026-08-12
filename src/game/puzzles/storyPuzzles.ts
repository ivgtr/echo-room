export const puzzleIds = [
  'puzzle_power_route',
  'puzzle_carrier_sync',
  'puzzle_maintenance_lock',
  'puzzle_signal_investigation',
  'puzzle_packet_repair',
  'puzzle_voiceprint_calibration',
  'puzzle_transmission_window',
] as const;

export type PuzzleId = (typeof puzzleIds)[number];

export type PuzzleDeviceCopy = {
  eyebrow: string;
  title: string;
  incorrectFeedback: string;
};

export const PUZZLE_DEVICE_COPY: Record<PuzzleId, PuzzleDeviceCopy> = {
  puzzle_power_route: {
    eyebrow: 'EMERGENCY POWER / BYPASS',
    title: '非常電源',
    incorrectFeedback:
      'CONTROL SIGNAL MISSING。配線の始まりに近い機器から確認。',
  },
  puzzle_carrier_sync: {
    eyebrow: 'ECHO BUFFER / CARRIER',
    title: '波形調整',
    incorrectFeedback: '同期できない。開始位置が基準と合っていない。',
  },
  puzzle_maintenance_lock: {
    eyebrow: 'MAINTENANCE / SYMBOL LOCK',
    title: 'ロッカーの記号錠',
    incorrectFeedback: 'LOCKED。記号の並びが合っていない。',
  },
  puzzle_signal_investigation: {
    eyebrow: 'LOG / CONDUIT INVESTIGATION',
    title: '通信記録と配線',
    incorrectFeedback: 'TRACE ERROR。波形か接続経路が一致していない。',
  },
  puzzle_packet_repair: {
    eyebrow: 'SIGNAL / FRAME RAIL',
    title: '破損データの復元',
    incorrectFeedback: 'FRAME ERROR。断片の端がつながっていない。',
  },
  puzzle_voiceprint_calibration: {
    eyebrow: 'VOICEPRINT / CALIBRATION',
    title: '声紋照合',
    incorrectFeedback: 'NO MATCH。三つの特徴のどれかが記録と違う。',
  },
  puzzle_transmission_window: {
    eyebrow: 'ECHO BUFFER / TEST ROUTE',
    title: '送信設定',
    incorrectFeedback: 'TEST FAILED。受信枠、時間差、送り先を確認。',
  },
};

const correctAnswers: Record<PuzzleId, readonly string[]> = {
  puzzle_power_route: ['terminal', 'intercom', 'buffer'],
  puzzle_carrier_sync: ['right-2', 'none', 'left-1'],
  puzzle_maintenance_lock: ['double', 'ring', 'triangle', 'node'],
  puzzle_signal_investigation: [
    's-b',
    's-c',
    's-a',
    'signal',
    'ring-relay',
    'echo-buffer',
  ],
  puzzle_packet_repair: ['c', 'd', 'a', 'b'],
  puzzle_voiceprint_calibration: ['compress-half', 'invert', 'left-2'],
  puzzle_transmission_window: [
    'packet-01',
    'packet-02',
    'packet-03',
    'packet-04',
    'minus-20',
    'echo-return',
  ],
};

export const isPuzzleAnswerCorrect = (
  puzzleId: PuzzleId,
  answer: readonly string[],
) => {
  const expected = correctAnswers[puzzleId];
  return (
    answer.length === expected.length &&
    answer.every((value, index) => value === expected[index])
  );
};

export const packetTexts = [
  '……聞こえるか？',
  'まず電源を戻せ。',
  'ログは気にするな。',
  '最後に、赤いボタンを押せ。',
] as const;
