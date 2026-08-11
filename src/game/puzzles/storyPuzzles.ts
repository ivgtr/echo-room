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

export type PuzzleOption = {
  id: string;
  label: string;
  detail?: string;
};

export type PuzzleTask = {
  id: string;
  prompt: string;
  options: readonly PuzzleOption[];
};

export type PuzzleDefinition = {
  id: PuzzleId;
  eyebrow: string;
  title: string;
  instruction: string;
  readout?: readonly string[];
  tasks: readonly PuzzleTask[];
  incorrectFeedback: string;
};

const option = (id: string, label: string, detail?: string): PuzzleOption => ({
  id,
  label,
  ...(detail ? { detail } : {}),
});

export const PUZZLE_DEFINITIONS: Record<PuzzleId, PuzzleDefinition> = {
  puzzle_power_route: {
    id: 'puzzle_power_route',
    eyebrow: 'EMERGENCY POWER / BYPASS ROUTE',
    title: '非常電源切替',
    instruction: '使用する線と、設備を起動する順番を設定する。',
    readout: [
      'LINE LOAD / TERMINAL 2・INTERCOM 1・ECHO BUFFER 3・DOOR 4 UNIT',
      'DOOR LINE / SHORT DETECTED',
      'START PROCEDURE / DESK COPY',
    ],
    tasks: [
      {
        id: 'isolate',
        prompt: '切り離す線',
        options: [
          option('door', 'DOOR / 4 UNIT', 'ショートした跡あり'),
          option('terminal', 'TERMINAL / 2 UNIT'),
          option('intercom', 'INTERCOM / 1 UNIT'),
          option('buffer', 'ECHO BUFFER / 3 UNIT'),
        ],
      },
      {
        id: 'feed-1',
        prompt: '最初に起動',
        options: [
          option('terminal', 'TERMINAL'),
          option('intercom', 'INTERCOM'),
          option('buffer', 'ECHO BUFFER'),
        ],
      },
      {
        id: 'feed-2',
        prompt: '次に起動',
        options: [
          option('terminal', 'TERMINAL'),
          option('intercom', 'INTERCOM'),
          option('buffer', 'ECHO BUFFER'),
        ],
      },
      {
        id: 'feed-3',
        prompt: '最後に起動',
        options: [
          option('terminal', 'TERMINAL'),
          option('intercom', 'INTERCOM'),
          option('buffer', 'ECHO BUFFER'),
        ],
      },
    ],
    incorrectFeedback: '保護回路が切れた。負荷か起動順が合っていない。',
  },
  puzzle_carrier_sync: {
    id: 'puzzle_carrier_sync',
    eyebrow: 'ECHO BUFFER / CARRIER CALIBRATION',
    title: '回線同期',
    instruction: 'A・B・Cの波を基準位置へ合わせる。',
    readout: [
      'REFERENCE / START 0',
      'CHANNEL A / START -2　　B / START 0　　C / START +1',
      'SERVICE PROCEDURE / DESK COPY',
    ],
    tasks: [
      {
        id: 'channel-a',
        prompt: 'Aを動かす方向',
        options: [
          option('left-2', '左へ2'),
          option('none', 'そのまま'),
          option('right-2', '右へ2'),
        ],
      },
      {
        id: 'channel-b',
        prompt: 'Bを動かす方向',
        options: [
          option('left-1', '左へ1'),
          option('none', 'そのまま'),
          option('right-1', '右へ1'),
        ],
      },
      {
        id: 'channel-c',
        prompt: 'Cを動かす方向',
        options: [
          option('left-1', '左へ1'),
          option('none', 'そのまま'),
          option('right-1', '右へ1'),
        ],
      },
    ],
    incorrectFeedback: '同期できない。開始位置が基準と合っていない。',
  },
  puzzle_maintenance_lock: {
    id: 'puzzle_maintenance_lock',
    eyebrow: 'MAINTENANCE LOCK / SYMBOL KEY',
    title: '保守ロッカー',
    instruction: '4つの記号を入力する。',
    readout: [
      'LOCK MODE / LAST INSPECTION',
      'INPUT SOURCE / DEVICE NAMEPLATES',
    ],
    tasks: [1, 2, 3, 4].map((slot) => ({
      id: `symbol-${slot}`,
      prompt: `${slot}番目の記号`,
      options: [
        option('double', '二重線 ║'),
        option('ring', '丸 ○'),
        option('triangle', '三角 △'),
        option('node', 'ひし形 ◆'),
      ],
    })),
    incorrectFeedback: 'ロックは開かない。銘板の並びと一致していない。',
  },
  puzzle_log_pairing: {
    id: 'puzzle_log_pairing',
    eyebrow: 'LOG / SIGNATURE CORRELATION',
    title: '通信ログ',
    instruction: '各RECEIVEに対応するSOURCEを指定する。',
    readout: [
      'RECEIVE R1 02:11:04：短・長・短 / R2 02:14:32：長・短・短 / R3 02:17:18：短・短・長',
      'SOURCE S-A 02:37:18：短・短・長 / S-B 02:31:04：短・長・短 / S-C 02:34:32：長・短・短',
    ],
    tasks: ['R1', 'R2', 'R3'].map((receive) => ({
      id: receive.toLowerCase(),
      prompt: `${receive} と同じ波のSOURCE`,
      options: [
        option('s-a', 'S-A'),
        option('s-b', 'S-B'),
        option('s-c', 'S-C'),
      ],
    })),
    incorrectFeedback: '組み合わせの中に、違う波形がある。',
  },
  puzzle_signal_route: {
    id: 'puzzle_signal_route',
    eyebrow: 'SECURITY / CONDUIT LAYER',
    title: '通信配線',
    instruction: 'インターホンから続く線を指定する。',
    tasks: [
      {
        id: 'layer',
        prompt: 'たどる線',
        options: [
          option('signal', '実線 / 通信'),
          option('power', '破線 / 電力'),
        ],
      },
      {
        id: 'junction',
        prompt: '壁の中で通る場所',
        options: [
          option('ring-relay', 'J-2 / 丸端子'),
          option('bar-relay', 'J-3 / 線端子'),
          option('node-relay', 'J-4 / ひし形端子'),
        ],
      },
      {
        id: 'destination',
        prompt: '線のつなぎ先',
        options: [
          option('control-room', 'CONTROL ROOM'),
          option('adjacent-room', 'E-02'),
          option('echo-buffer', 'ECHO BUFFER RETURN'),
        ],
      },
    ],
    incorrectFeedback: '選んだ線は、途中で接続が切れている。',
  },
  puzzle_packet_repair: {
    id: 'puzzle_packet_repair',
    eyebrow: 'SIGNAL / FRAME RECOVERY',
    title: '破損PACKET',
    instruction: '4つの断片を、先頭から順に並べる。',
    readout: [
      'FRAME FORMAT / HEADER → BODY → VOICEPRINT → CHECK',
      'HEADER「｜」 / VOICEPRINT「三本線」 / CHECK「■」',
      '断片A：波形◇→三本線 / B：三本線→■ / C：｜→波形△ / D：波形△→◇',
    ],
    tasks: [1, 2, 3, 4].map((slot) => ({
      id: `fragment-${slot}`,
      prompt: `${slot}番目の断片`,
      options: [
        option('a', '断片A'),
        option('b', '断片B'),
        option('c', '断片C'),
        option('d', '断片D'),
      ],
    })),
    incorrectFeedback: 'フレーム検査に失敗した。断片の端がつながっていない。',
  },
  puzzle_temporal_anomaly: {
    id: 'puzzle_temporal_anomaly',
    eyebrow: 'SIGNAL / EVENT CORRELATION',
    title: 'PACKET検査',
    instruction: '異常なPACKETと、その判断理由を記録する。',
    tasks: [
      {
        id: 'anomaly',
        prompt: '異常があるPACKET',
        options: [
          option('packet-01', 'PACKET 01 / ……聞こえるか？'),
          option('packet-02', 'PACKET 02 / まず電源を戻せ。'),
          option('packet-03', 'PACKET 03 / ログは気にするな。'),
          option('packet-04', 'PACKET 04 / 最後に、赤いボタンを押せ。'),
        ],
      },
      {
        id: 'basis',
        prompt: 'そう判断できる理由',
        options: [
          option('unseen-event', 'まだしていない操作を知っている'),
          option('different-room', '別室から見ている'),
          option('clock-broken', '時計が止まっている'),
        ],
      },
    ],
    incorrectFeedback: 'その判断では、記録済みの出来事と矛盾しない。',
  },
  puzzle_voiceprint_calibration: {
    id: 'puzzle_voiceprint_calibration',
    eyebrow: 'VOICEPRINT / FEATURE CALIBRATION',
    title: '声紋照合',
    instruction: '受信データを、職員カードに記録された波形へ合わせる。',
    readout: [
      'STAFF RECORD / 間隔 1-2-1・上下 上-下-上・開始 0',
      'RECEIVED / 間隔 2-4-2・上下 下-上-下・開始 +2',
    ],
    tasks: [
      {
        id: 'spacing',
        prompt: '波の間隔',
        options: [
          option('compress-half', '半分にする'),
          option('keep', 'そのまま'),
          option('expand-double', '2倍にする'),
        ],
      },
      {
        id: 'envelope',
        prompt: '波の上下',
        options: [
          option('invert', '上下反転'),
          option('keep', 'そのまま'),
          option('reverse', '左右反転'),
        ],
      },
      {
        id: 'phase',
        prompt: '波の開始位置',
        options: [
          option('left-2', '左へ2'),
          option('keep', 'そのまま'),
          option('right-2', '右へ2'),
        ],
      },
    ],
    incorrectFeedback: '一致しない。3つの特徴のどれかが記録と違う。',
  },
  puzzle_causal_script: {
    id: 'puzzle_causal_script',
    eyebrow: 'ECHO SCRIPT / CAUSAL ORDER',
    title: '送信文編集',
    instruction: '送信する4つの文を、過去の自分が受け取った順に並べる。',
    tasks: [1, 2, 3, 4].map((slot) => ({
      id: `line-${slot}`,
      prompt: `${slot}番目の発言`,
      options: [
        option('packet-01', '……聞こえるか？'),
        option('packet-02', 'まず電源を戻せ。'),
        option('packet-03', 'ログは気にするな。'),
        option('packet-04', '最後に、赤いボタンを押せ。'),
      ],
    })),
    incorrectFeedback: 'この順番では、過去の応答記録とつながらない。',
  },
  puzzle_transmission_window: {
    id: 'puzzle_transmission_window',
    eyebrow: 'ECHO BUFFER / TRANSMISSION PLAN',
    title: '送信予約',
    instruction: '4つの送信枠、送る時刻、送り先を設定する。',
    readout: [
      '受信タイミング：W1 返事をする前 / W2 電源を調べる前 / W3 LOGを開いた直後 / W4 最後の操作の前',
    ],
    tasks: [
      ...[1, 2, 3, 4].map((slot) => ({
        id: `window-${slot}`,
        prompt: `受信タイミング W${slot}`,
        options: [
          option('packet-01', '……聞こえるか？'),
          option('packet-02', 'まず電源を戻せ。'),
          option('packet-03', 'ログは気にするな。'),
          option('packet-04', '最後に、赤いボタンを押せ。'),
        ],
      })),
      {
        id: 'delay',
        prompt: '送る時刻',
        options: [
          option('minus-10', '-00:10:00'),
          option('minus-20', '-00:20:00'),
          option('plus-20', '+00:20:00'),
        ],
      },
      {
        id: 'route',
        prompt: '送り先',
        options: [
          option('control', 'CONTROL ROOM'),
          option('echo-return', 'ECHO BUFFER RETURN'),
          option('adjacent', 'E-02'),
        ],
      },
    ],
    incorrectFeedback: '送信テストに失敗した。設定のどこかが記録と違う。',
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
