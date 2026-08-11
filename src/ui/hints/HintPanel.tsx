import type { StoryStage } from '../../game/machine/gameMachine';

const hints: Partial<Record<StoryStage, [string, string, string]>> = {
  puzzle_carrier_sync: [
    '基準の波とA・B・Cが、最初に上がる位置を比べる。',
    '早い波は右へ、遅い波は左へ動かす。',
    'Aは右へ2、Bはそのまま、Cは左へ1。',
  ],
  puzzle_maintenance_lock: [
    'デスクにある点検順と、各機器の記号を見比べる。',
    '機器名を、同じ機器の記号に置き換える。',
    '二重線、丸、三角、ひし形の順。',
  ],
  puzzle_signal_investigation: [
    '同じ波を3組つないだ後、その通信線を地図で追う。',
    'R1=S-B、R2=S-C、R3=S-A。通信の実線と丸い端子を見る。',
    '3組をつなぎ、通信の実線→J-2→ECHO BUFFER RETURN。',
  ],
  puzzle_packet_repair: [
    '最初の「｜」と最後の「■」を先に決める。',
    '隣り合う断片の端を、同じ記号にする。',
    'C、D、A、Bの順。',
  ],
  puzzle_voiceprint_calibration: [
    '受信データを、職員カードと同じ形にする。',
    '波の間隔、上下、開始位置を別々に直す。',
    '間隔は半分、上下は反転、開始位置は左へ2。',
  ],
  puzzle_transmission_window: [
    '4つの発言を、受け取った順に置く。',
    '4つとも、同じ時刻と同じ送り先を使う。',
    '会話順、-00:20:00、ECHO BUFFER RETURN。',
  ],
  transmission_ready: [
    '送信テストは終わっている。',
    'SYSTEMに戻り、送る内容を確認する。',
    '赤い送信ボタンを押す。',
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
