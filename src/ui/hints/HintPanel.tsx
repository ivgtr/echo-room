import type { StoryStage } from '../../game/machine/gameMachine';

const hints: Partial<Record<StoryStage, [string, string, string]>> = {
  puzzle_carrier_sync: [
    'SYSTEMの基準波とA・B・Cの同期点を比較する。',
    '早い波形は右、遅い波形は左へ戻す。',
    'Aは右2、Bは補正なし、Cは左1。',
  ],
  puzzle_maintenance_lock: [
    'デスクの点検順と回路銘板を対応させる。',
    '機器名を、同じ機器の回路記号へ置き換える。',
    '二重線、環、三角、節点の順。',
  ],
  puzzle_log_pairing: [
    '時刻順ではなく三節の波形指紋を比べる。',
    '短・長・短など、三つすべてが同じ組を探す。',
    'R1=S-B、R2=S-C、R3=S-A。',
  ],
  puzzle_signal_route: [
    'SECURITYで室内図と配線層を重ねる。',
    '実線と環端子を切らさずに追う。',
    '通信実線→J-2環端子→ECHO BUFFER RETURN。',
  ],
  puzzle_packet_repair: [
    'HEADERの開始記号とCHECKの終端記号を先に固定する。',
    '隣り合う断片の端記号を一致させる。',
    'C、D、A、Bの順。',
  ],
  puzzle_temporal_anomaly: [
    '各発言が、どの出来事の後なら言えるか考える。',
    'まだ見ても操作してもいない設備への指示に注目する。',
    'PACKET 04は未発生の赤いボタン操作を知っている。',
  ],
  puzzle_voiceprint_calibration: [
    '受信形を職員カードの基準形へ戻す。',
    '尺度、上下、時間位置を別々に補正する。',
    '1/2圧縮、上下反転、左へ2。',
  ],
  puzzle_causal_script: [
    'PACKET番号ではなく、発言可能になる設備状態を見る。',
    '応答確認→電源→LOG→最終操作の因果を作る。',
    '聞こえるか、電源、ログ、赤いボタンの順。',
  ],
  puzzle_transmission_window: [
    '再構成した会話を冒頭の四つの受信窓へ割り当てる。',
    '全PACKETは同じ20分遅延と、確認済みの回線を使う。',
    '会話順、-00:20:00、ECHO BUFFER RETURN。',
  ],
  transmission_ready: [
    '送信計画は試験を通過している。',
    'SYSTEMに戻り、確定内容を確認する。',
    '赤い送信ボタンで因果を完成させる。',
  ],
};

export function HintPanel({
  stage,
  level,
  onReveal,
  onClose,
}: {
  stage: StoryStage;
  level: number;
  onReveal: () => void;
  onClose: () => void;
}) {
  const stageHints = hints[stage] ?? [
    '周囲をもう一度調べよう。',
    'SYSTEMで現在の目的を確認しよう。',
    '取得済みの証拠を再確認しよう。',
  ];
  return (
    <section
      className="puzzle-modal compact-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-title"
    >
      <h2 id="hint-title">ヒント</h2>
      {stageHints.slice(0, level).map((hint, index) => (
        <p key={hint}>
          LEVEL {index + 1}: {hint}
        </p>
      ))}
      {level < 3 && (
        <button type="button" onClick={onReveal}>
          次のヒントを見る
        </button>
      )}
      <button type="button" onClick={onClose}>
        閉じる
      </button>
    </section>
  );
}
