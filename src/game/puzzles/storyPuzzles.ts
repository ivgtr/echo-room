export const puzzleIds = [
  'puzzle_power_route',
  'puzzle_carrier_sync',
  'puzzle_maintenance_lock',
  'puzzle_log_pairing',
  'puzzle_signal_route',
  'puzzle_packet_repair',
  'puzzle_temporal_anomaly',
  'puzzle_voiceprint_calibration',
  'puzzle_causal_script',
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
    title: '非常電源切替盤',
    incorrectFeedback: '保護回路が作動。隔離線か投入順を点検。',
  },
  puzzle_carrier_sync: {
    eyebrow: 'ECHO BUFFER / CARRIER',
    title: '搬送波同期器',
    incorrectFeedback: '同期できない。開始位置が基準と合っていない。',
  },
  puzzle_maintenance_lock: {
    eyebrow: 'MAINTENANCE / SYMBOL LOCK',
    title: '保守ロッカー錠',
    incorrectFeedback: 'LOCKED。銘板の並びと一致していない。',
  },
  puzzle_log_pairing: {
    eyebrow: 'LOG / PATCH BAY',
    title: '通信ログ接続盤',
    incorrectFeedback: 'SIGNATURE MISMATCH。違う波形が接続されている。',
  },
  puzzle_signal_route: {
    eyebrow: 'SECURITY / CONDUIT TRACE',
    title: '通信配線トレーサー',
    incorrectFeedback: 'OPEN CIRCUIT。選んだ経路は途中で切れている。',
  },
  puzzle_packet_repair: {
    eyebrow: 'SIGNAL / FRAME RAIL',
    title: 'PACKET復元レール',
    incorrectFeedback: 'FRAME ERROR。断片の端がつながっていない。',
  },
  puzzle_temporal_anomaly: {
    eyebrow: 'SIGNAL / EVENT SCANNER',
    title: 'PACKET検査器',
    incorrectFeedback: 'NO ANOMALY。記録済みの出来事と矛盾しない。',
  },
  puzzle_voiceprint_calibration: {
    eyebrow: 'VOICEPRINT / CALIBRATION',
    title: '声紋特徴量校正器',
    incorrectFeedback: 'NO MATCH。三つの特徴のどれかが記録と違う。',
  },
  puzzle_causal_script: {
    eyebrow: 'ECHO SCRIPT / EDITOR',
    title: '送信文編集レール',
    incorrectFeedback: 'SEQUENCE ERROR。過去の応答記録とつながらない。',
  },
  puzzle_transmission_window: {
    eyebrow: 'ECHO BUFFER / TEST ROUTE',
    title: '送信窓設定盤',
    incorrectFeedback: 'TEST FAILED。受信窓、遅延、終端を点検。',
  },
};

const correctAnswers: Record<PuzzleId, readonly string[]> = {
  puzzle_power_route: ['door', 'terminal', 'intercom', 'buffer'],
  puzzle_carrier_sync: ['right-2', 'none', 'left-1'],
  puzzle_maintenance_lock: ['double', 'ring', 'triangle', 'node'],
  puzzle_log_pairing: ['s-b', 's-c', 's-a'],
  puzzle_signal_route: ['signal', 'ring-relay', 'echo-buffer'],
  puzzle_packet_repair: ['c', 'd', 'a', 'b'],
  puzzle_temporal_anomaly: ['packet-04', 'unseen-event'],
  puzzle_voiceprint_calibration: ['compress-half', 'invert', 'left-2'],
  puzzle_causal_script: ['packet-01', 'packet-02', 'packet-03', 'packet-04'],
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
