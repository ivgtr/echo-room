import type { StoryStage } from '../../game/machine/gameMachine';
import { ContextBackButton } from '../common/ContextBackButton';

type HintStage = StoryStage | 'puzzle_power_route';

const hints: Partial<Record<HintStage, [string, string, string]>> = {
  puzzle_power_route: [
    '机の引き継ぎメモと、ブレーカーの状態灯・煤・上の配線を見比べる。',
    '煤のあるDOOR回路を切る。その後、上の配線を根元からたどって復帰順を読む。',
    'DOORをOFFにして、TERMINAL、INTERCOM、ECHO BUFFERの順にONにする。',
  ],
  puzzle_carrier_sync: [
    '基準の波とA・B・Cが、最初に上がる位置を比べる。',
    '早い波は右へ、遅い波は左へ動かす。',
    'Aは右へ2、Bはそのまま、Cは左へ1。',
  ],
  puzzle_maintenance_lock: [
    '机の戸締まりメモに出てくる機器と、それぞれに刻まれた記号を見比べる。',
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
    '端末横のパネルで、受信データと職員記録の波形を見比べる。',
    '波の間隔、上下、開始位置を別々に直す。',
    '間隔は半分、上下は反転、開始位置は左へ2。',
  ],
  puzzle_transmission_window: [
    '文を受け取る前と後で、何が起きたか。端末の「会話履歴」で確かめる。配置はそのまま残る。',
    '返事、設備の起動、時刻への疑問、まだ行っていない操作への反応を、文と結びつける。時間と送り先はLOGとSECURITYで再確認できる。',
    '「誰だ？」には「聞こえるか」、「起動した」には電源の指示。「戻ってる？」の直後はログへの忠告、復元した文への反応は赤いボタン。時間差は-00:20:00、送り先はECHO BUFFER RETURN。',
  ],
  transmission_ready: [
    '送信テストは終わっている。',
    '端末のSYSTEM表示で、送る内容を確認する。',
    '赤い送信ボタンを押す。',
  ],
};

export function HintPanel({
  stage,
  level,
  onReveal,
  onClose,
}: {
  stage: HintStage;
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
      <ContextBackButton destination="SYSTEMへ戻る" onClick={onClose} />
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
    </section>
  );
}
