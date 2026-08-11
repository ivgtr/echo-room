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
    title: '非常電源経路',
    instruction:
      '損傷した回路を隔離し、容量7 UNIT以内で通信設備を順に起動する。',
    evidence: [
      '非常電源容量：7 UNIT',
      '端末 2 / インターホン 1 / ECHO BUFFER 3 / ドア駆動 4 UNIT',
      'ドア駆動線には短絡痕。端末はBUFFERより先、BUFFERは最後に接続する。',
    ],
    tasks: [
      {
        id: 'isolate',
        prompt: '最初に隔離する系統',
        options: [
          option('door', 'DOOR / 4 UNIT', '短絡痕あり'),
          option('terminal', 'TERMINAL / 2 UNIT'),
          option('intercom', 'INTERCOM / 1 UNIT'),
          option('buffer', 'ECHO BUFFER / 3 UNIT'),
        ],
      },
      {
        id: 'feed-1',
        prompt: '給電順 1',
        options: [
          option('terminal', 'TERMINAL'),
          option('intercom', 'INTERCOM'),
          option('buffer', 'ECHO BUFFER'),
        ],
      },
      {
        id: 'feed-2',
        prompt: '給電順 2',
        options: [
          option('terminal', 'TERMINAL'),
          option('intercom', 'INTERCOM'),
          option('buffer', 'ECHO BUFFER'),
        ],
      },
      {
        id: 'feed-3',
        prompt: '給電順 3',
        options: [
          option('terminal', 'TERMINAL'),
          option('intercom', 'INTERCOM'),
          option('buffer', 'ECHO BUFFER'),
        ],
      },
    ],
    incorrectFeedback:
      '保護回路が作動した。容量、短絡痕、起動条件をすべて満たす必要がある。',
  },
  puzzle_carrier_sync: {
    id: 'puzzle_carrier_sync',
    number: 2,
    eyebrow: 'ECHO BUFFER / CARRIER CALIBRATION',
    title: '搬送波同期',
    instruction:
      '基準波の立ち上がり位置と各回線のマーカーを比較し、位相を合わせる。',
    evidence: [
      '基準波：＿▔▔＿ / 同期点は最初の立ち上がり',
      'A：2目盛り早い / B：同期済み / C：1目盛り遅い',
      '補正方向は、早い場合は右、遅い場合は左へ移す。',
    ],
    tasks: [
      {
        id: 'channel-a',
        prompt: 'CHANNEL A 補正',
        options: [
          option('left-2', '左へ2'),
          option('none', '補正なし'),
          option('right-2', '右へ2'),
        ],
      },
      {
        id: 'channel-b',
        prompt: 'CHANNEL B 補正',
        options: [
          option('left-1', '左へ1'),
          option('none', '補正なし'),
          option('right-1', '右へ1'),
        ],
      },
      {
        id: 'channel-c',
        prompt: 'CHANNEL C 補正',
        options: [
          option('left-1', '左へ1'),
          option('none', '補正なし'),
          option('right-1', '右へ1'),
        ],
      },
    ],
    incorrectFeedback:
      '同期点が一致しない。早い波形と遅い波形では補正方向が逆になる。',
  },
  puzzle_maintenance_lock: {
    id: 'puzzle_maintenance_lock',
    number: 3,
    eyebrow: 'MAINTENANCE LOCK / SYMBOL KEY',
    title: '保守ロッカー',
    instruction: '点検表の機器順を、現場の回路記号へ変換して4枠へ設定する。',
    evidence: [
      '点検順：端末 → 通話器 → BUFFER → ドア',
      '回路銘板：端末＝二重線 / 通話器＝環 / BUFFER＝三角 / ドア＝節点',
      '数字や時刻は保守錠には使用しない。',
    ],
    tasks: [1, 2, 3, 4].map((slot) => ({
      id: `symbol-${slot}`,
      prompt: `記号枠 ${slot}`,
      options: [
        option('double', '二重線 ║'),
        option('ring', '環 ○'),
        option('triangle', '三角 △'),
        option('node', '節点 ◆'),
      ],
    })),
    incorrectFeedback:
      '記号列が違う。点検対象の名称を回路銘板の記号へ置き換える。',
  },
  puzzle_log_pairing: {
    id: 'puzzle_log_pairing',
    number: 4,
    eyebrow: 'LOG / SIGNATURE CORRELATION',
    title: '通信ログ照合',
    instruction:
      '受信ログの波形指紋と一致する送信ログを対応させる。時刻順は一致しない。',
    evidence: [
      'RECEIVE R1 02:11:04：短・長・短 / R2 02:14:32：長・短・短 / R3 02:17:18：短・短・長',
      'SOURCE S-A 02:37:18：短・短・長 / S-B 02:31:04：短・長・短 / S-C 02:34:32：長・短・短',
      '同じ通信は時刻ではなく、三節の波形指紋が一致する。',
    ],
    tasks: ['R1', 'R2', 'R3'].map((receive) => ({
      id: receive.toLowerCase(),
      prompt: `${receive} に対応するSOURCE`,
      options: [
        option('s-a', 'S-A'),
        option('s-b', 'S-B'),
        option('s-c', 'S-C'),
      ],
    })),
    incorrectFeedback: '指紋が一致しない組がある。三節すべてを比較する。',
  },
  puzzle_signal_route: {
    id: 'puzzle_signal_route',
    number: 5,
    eyebrow: 'SECURITY / CONDUIT LAYER',
    title: '通信経路追跡',
    instruction:
      '室内図と保守配線層を重ね、E-01インターホンから続く経路を選ぶ。',
    evidence: [
      'E-01の左右は設備壁。隣室へ通じる区画はない。',
      '実線は音声設備、破線は電力設備。中継器は同じ端子記号だけを接続する。',
      'インターホン端子は環 ○。ECHO BUFFER終端も環 ○。',
    ],
    tasks: [
      {
        id: 'layer',
        prompt: '追跡する配線層',
        options: [
          option('signal', '実線 / 通信'),
          option('power', '破線 / 電力'),
        ],
      },
      {
        id: 'junction',
        prompt: '設備壁内の中継点',
        options: [
          option('ring-relay', 'J-2 / 環端子'),
          option('bar-relay', 'J-3 / 線端子'),
          option('node-relay', 'J-4 / 節点端子'),
        ],
      },
      {
        id: 'destination',
        prompt: '回線の終端',
        options: [
          option('control-room', 'CONTROL ROOM'),
          option('adjacent-room', 'E-02'),
          option('echo-buffer', 'ECHO BUFFER RETURN'),
        ],
      },
    ],
    incorrectFeedback: '経路が途中で途切れる。線種と端子記号の両方を維持する。',
  },
  puzzle_packet_repair: {
    id: 'puzzle_packet_repair',
    number: 6,
    eyebrow: 'SIGNAL / FRAME RECOVERY',
    title: 'PACKETフレーム復元',
    instruction:
      '波形の端とフレーム種別を照合し、破損PACKETを先頭から復元する。',
    evidence: [
      'HEADERは同期記号「｜」から始まり、VOICEPRINTは三本線、CHECKは終端「■」で終わる。',
      '断片A：波形◇→三本線 / B：三本線→■ / C：｜→波形△ / D：波形△→◇',
      '隣接する断片では、右端と左端の記号が同じになる。',
    ],
    tasks: [1, 2, 3, 4].map((slot) => ({
      id: `fragment-${slot}`,
      prompt: `復元位置 ${slot}`,
      options: [
        option('a', '断片A'),
        option('b', '断片B'),
        option('c', '断片C'),
        option('d', '断片D'),
      ],
    })),
    incorrectFeedback:
      'フレーム検証に失敗した。先頭・終端と断片間の接続を確認する。',
  },
  puzzle_temporal_anomaly: {
    id: 'puzzle_temporal_anomaly',
    number: 7,
    eyebrow: 'SIGNAL / EVENT CORRELATION',
    title: '時系列矛盾',
    instruction:
      '復元した発言が成立する出来事を対応させ、まだ原因が存在しないPACKETを特定する。',
    evidence: [
      '「聞こえるか」＝覚醒後の応答確認 / 「電源を戻せ」＝停電中の指示',
      '「ログは気にするな」＝LOGを開いた直後の制止',
      '赤い送信ボタンはまだ操作も目撃もしていない。',
    ],
    tasks: [
      {
        id: 'anomaly',
        prompt: '現在より後の出来事を前提にするPACKET',
        options: [
          option('packet-01', 'PACKET 01 / ……聞こえるか？'),
          option('packet-02', 'PACKET 02 / まず電源を戻せ。'),
          option('packet-03', 'PACKET 03 / ログは気にするな。'),
          option('packet-04', 'PACKET 04 / 最後に、赤いボタンを押せ。'),
        ],
      },
      {
        id: 'basis',
        prompt: '矛盾を成立させる根拠',
        options: [
          option('unseen-event', '未発生の操作を知っている'),
          option('different-room', '別室から見ている'),
          option('clock-broken', '時計が止まっている'),
        ],
      },
    ],
    incorrectFeedback:
      '既に起きた出来事と、まだ起きていない出来事を分けて考える。',
  },
  puzzle_voiceprint_calibration: {
    id: 'puzzle_voiceprint_calibration',
    number: 8,
    eyebrow: 'VOICEPRINT / FEATURE CALIBRATION',
    title: '声紋特徴量の校正',
    instruction:
      '職員カードの基準形とPACKETの三特徴を比較し、記録時の変換を戻す。音声再生は行わない。',
    evidence: [
      '基準：間隔 1-2-1 / 包絡 上-下-上 / 位相 同期点0',
      '受信：間隔 2-4-2 / 包絡 下-上-下 / 位相 同期点+2',
      '受信処理では尺度、上下、時間位置が独立して変化する。',
    ],
    tasks: [
      {
        id: 'spacing',
        prompt: '間隔チャンネルの補正',
        options: [
          option('compress-half', '1/2へ圧縮'),
          option('keep', '維持'),
          option('expand-double', '2倍へ拡大'),
        ],
      },
      {
        id: 'envelope',
        prompt: '包絡チャンネルの補正',
        options: [
          option('invert', '上下反転'),
          option('keep', '維持'),
          option('reverse', '左右反転'),
        ],
      },
      {
        id: 'phase',
        prompt: '位相チャンネルの補正',
        options: [
          option('left-2', '左へ2'),
          option('keep', '維持'),
          option('right-2', '右へ2'),
        ],
      },
    ],
    incorrectFeedback:
      '基準形と一致しない特徴が残っている。三チャンネルを個別に戻す。',
  },
  puzzle_causal_script: {
    id: 'puzzle_causal_script',
    number: 9,
    eyebrow: 'ECHO SCRIPT / CAUSAL ORDER',
    title: '因果会話の再構成',
    instruction:
      '過去側の反応と設備状態を根拠に、未来側が送る4文を成立順へ並べる。',
    evidence: [
      '応答確認は指示より前。電源復旧後にだけLOGを閲覧できる。',
      '赤いボタンの指示は、他の三通信を受け取った後に置かれる。',
      'PACKET番号は復元時の仮番号で、順序の根拠にはしない。',
    ],
    tasks: [1, 2, 3, 4].map((slot) => ({
      id: `line-${slot}`,
      prompt: `会話位置 ${slot}`,
      options: [
        option('packet-01', '……聞こえるか？'),
        option('packet-02', 'まず電源を戻せ。'),
        option('packet-03', 'ログは気にするな。'),
        option('packet-04', '最後に、赤いボタンを押せ。'),
      ],
    })),
    incorrectFeedback:
      '会話の因果が成立しない。各発言が可能になる設備状態を確認する。',
  },
  puzzle_transmission_window: {
    id: 'puzzle_transmission_window',
    number: 10,
    eyebrow: 'ECHO BUFFER / TRANSMISSION PLAN',
    title: '最終送信設計',
    instruction:
      '冒頭の4受信窓へPACKETを割り当て、固定遅延と回線終端を設定する。',
    evidence: [
      '冒頭受信窓：W1 応答前 / W2 電源調査前 / W3 LOG閲覧直後 / W4 最終操作前',
      '送信原理は全PACKET共通で-00:20:00。可変遅延は使用できない。',
      'SECURITYで確認した正規終端はECHO BUFFER RETURN。',
    ],
    tasks: [
      ...[1, 2, 3, 4].map((slot) => ({
        id: `window-${slot}`,
        prompt: `受信窓 W${slot}`,
        options: [
          option('packet-01', '……聞こえるか？'),
          option('packet-02', 'まず電源を戻せ。'),
          option('packet-03', 'ログは気にするな。'),
          option('packet-04', '最後に、赤いボタンを押せ。'),
        ],
      })),
      {
        id: 'delay',
        prompt: '共通送信遅延',
        options: [
          option('minus-10', '-00:10:00'),
          option('minus-20', '-00:20:00'),
          option('plus-20', '+00:20:00'),
        ],
      },
      {
        id: 'route',
        prompt: '送信回線',
        options: [
          option('control', 'CONTROL ROOM'),
          option('echo-return', 'ECHO BUFFER RETURN'),
          option('adjacent', 'E-02'),
        ],
      },
    ],
    incorrectFeedback:
      '試験送信が閉じない。受信順、固定遅延、正規終端をすべて満たす。',
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
