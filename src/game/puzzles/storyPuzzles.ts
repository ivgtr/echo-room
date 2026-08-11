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
  number: number;
  eyebrow: string;
  title: string;
  instruction: string;
  evidence: readonly string[];
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
    number: 1,
    eyebrow: 'EMERGENCY POWER / BYPASS ROUTE',
    title: '非常電源をつなぐ',
    instruction: '壊れた線を切り離し、合計7 UNIT以内で3つの設備を起動する。',
    evidence: [
      '非常電源容量：7 UNIT',
      '端末 2 / インターホン 1 / ECHO BUFFER 3 / ドア駆動 4 UNIT',
      'ドアの線にはショートした跡がある。端末はBUFFERより先、BUFFERは最後につなぐ。',
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
    incorrectFeedback:
      '電源が止まった。合計容量、ドアの線、起動する順番を見直そう。',
  },
  puzzle_carrier_sync: {
    id: 'puzzle_carrier_sync',
    number: 2,
    eyebrow: 'ECHO BUFFER / CARRIER CALIBRATION',
    title: '波のずれを直す',
    instruction: '基準の波とA・B・Cを見比べ、ずれた分だけ左右へ動かす。',
    evidence: [
      '基準の波：＿▔▔＿ / 合わせる位置は最初に波が上がる所',
      'Aは2目盛り早い。Bは合っている。Cは1目盛り遅い。',
      '早い波は右へ、遅い波は左へ動かす。',
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
    incorrectFeedback:
      '波の位置が合っていない。早い波は右、遅い波は左へ動かそう。',
  },
  puzzle_maintenance_lock: {
    id: 'puzzle_maintenance_lock',
    number: 3,
    eyebrow: 'MAINTENANCE LOCK / SYMBOL KEY',
    title: '保守ロッカーの記号',
    instruction: '点検する機器の順番を、それぞれの記号に置き換える。',
    evidence: [
      '点検順：端末 → 通話器 → BUFFER → ドア',
      '機器の記号：端末＝二重線 / 通話器＝丸 / BUFFER＝三角 / ドア＝ひし形',
      'この錠で使うのは数字や時刻ではなく、機器の記号だ。',
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
    incorrectFeedback:
      '記号の順番が違う。点検順に並んだ機器を、一つずつ記号に置き換えよう。',
  },
  puzzle_log_pairing: {
    id: 'puzzle_log_pairing',
    number: 4,
    eyebrow: 'LOG / SIGNATURE CORRELATION',
    title: '同じ通信を探す',
    instruction: '受信と送信の波の並びを見比べ、同じ形のログを組み合わせる。',
    evidence: [
      'RECEIVE R1 02:11:04：短・長・短 / R2 02:14:32：長・短・短 / R3 02:17:18：短・短・長',
      'SOURCE S-A 02:37:18：短・短・長 / S-B 02:31:04：短・長・短 / S-C 02:34:32：長・短・短',
      '同じ通信なら、時刻に関係なく3つの波がすべて同じ順に並ぶ。',
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
    incorrectFeedback: '違う形の波が混じっている。3つの波を順番に見比べよう。',
  },
  puzzle_signal_route: {
    id: 'puzzle_signal_route',
    number: 5,
    eyebrow: 'SECURITY / CONDUIT LAYER',
    title: '通信線をたどる',
    instruction: '部屋の図と配線図を重ね、インターホンから続く線をたどる。',
    evidence: [
      'E-01の左右は厚い設備壁で、隣の部屋はない。',
      '実線は通信、破線は電力。同じ形の端子どうしがつながる。',
      'インターホンの端子は丸 ○。ECHO BUFFER RETURNも丸 ○。',
    ],
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
    incorrectFeedback:
      '途中で線が切れている。実線と同じ形の端子を続けてたどろう。',
  },
  puzzle_packet_repair: {
    id: 'puzzle_packet_repair',
    number: 6,
    eyebrow: 'SIGNAL / FRAME RECOVERY',
    title: 'PACKETをつなぎ直す',
    instruction: '4つの断片の端を見比べ、壊れたPACKETを先頭からつなぎ直す。',
    evidence: [
      '先頭のHEADERは「｜」から始まる。最後のCHECKは「■」で終わる。VOICEPRINTの印は三本線。',
      '断片A：波形◇→三本線 / B：三本線→■ / C：｜→波形△ / D：波形△→◇',
      '隣り合う断片は、右端と左端が同じ記号になる。',
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
    incorrectFeedback:
      '断片がつながっていない。最初と最後を決めてから、同じ記号の端を合わせよう。',
  },
  puzzle_temporal_anomaly: {
    id: 'puzzle_temporal_anomaly',
    number: 7,
    eyebrow: 'SIGNAL / EVENT CORRELATION',
    title: 'まだ起きていないこと',
    instruction:
      '4つの発言をこれまでの出来事と比べ、未来を知っている発言を探す。',
    evidence: [
      '「聞こえるか」は目覚めた直後。「電源を戻せ」は停電中に聞いた。',
      '「ログは気にするな」はLOGを開いた直後に聞いた。',
      '赤い送信ボタンは、まだ見たことも押したこともない。',
    ],
    tasks: [
      {
        id: 'anomaly',
        prompt: '未来のことを知っているPACKET',
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
    incorrectFeedback:
      'その発言は過去の出来事で説明できる。まだ見ていない物への指示を探そう。',
  },
  puzzle_voiceprint_calibration: {
    id: 'puzzle_voiceprint_calibration',
    number: 8,
    eyebrow: 'VOICEPRINT / FEATURE CALIBRATION',
    title: '声紋データを合わせる',
    instruction:
      '職員カードの見本と受信データを比べ、3つの波を同じ形にする。音を聞く必要はない。',
    evidence: [
      '職員カード：波の間隔 1-2-1 / 上下の並び 上-下-上 / 開始位置 0',
      '受信データ：波の間隔 2-4-2 / 上下の並び 下-上-下 / 開始位置 +2',
      '間隔、上下、開始位置は別々に直せる。',
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
    incorrectFeedback:
      'まだ職員カードと違う所がある。間隔、上下、開始位置を一つずつ比べよう。',
  },
  puzzle_causal_script: {
    id: 'puzzle_causal_script',
    number: 9,
    eyebrow: 'ECHO SCRIPT / CAUSAL ORDER',
    title: '会話を正しい順に戻す',
    instruction:
      '過去の自分が何をしていたかを手掛かりに、4つの発言を並べ直す。',
    evidence: [
      '呼びかけは、電源の指示より前。LOGを開けるのは、電源が戻った後。',
      '赤いボタンの話は、ほかの3つの通信を受け取った後。',
      'PACKET番号は仮の番号なので、会話の順番とは関係ない。',
    ],
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
    incorrectFeedback:
      'この順番では会話がつながらない。呼びかけ、電源、LOG、赤いボタンの順を考えよう。',
  },
  puzzle_transmission_window: {
    id: 'puzzle_transmission_window',
    number: 10,
    eyebrow: 'ECHO BUFFER / TRANSMISSION PLAN',
    title: '20分前へ送る',
    instruction: '4つの発言を受け取った順に置き、送る時刻と送り先を決める。',
    evidence: [
      '受信タイミング：W1 返事をする前 / W2 電源を調べる前 / W3 LOGを開いた直後 / W4 最後の操作の前',
      '4つとも同じ時刻へ送る。20分前は -00:20:00。',
      'SECURITYで確認した送り先は ECHO BUFFER RETURN。',
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
    incorrectFeedback:
      '送信テストに失敗した。発言の順番、20分前、送り先を見直そう。',
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
