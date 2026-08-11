import type { StoryStage } from '../../game/machine/gameMachine';

const hints: Partial<Record<StoryStage, [string, string, string]>> = {
  inspect_logs: [
    '端末のLOGを開こう。',
    'RECEIVEとSOURCEの同じ行を比べる。',
    '送信元は受信より正確に20分後だ。',
  ],
  unlock_locker: [
    '緊急時メモを確認しよう。',
    'SYSTEMの送信側時刻を使う。',
    '02:37を4桁の0237として入力する。',
  ],
  reveal_no_adjacent_room: [
    '所持品とSECURITYを確認しよう。',
    '2つの図面でE-01の左右を見る。',
    '隣室は存在しない。',
  ],
  inspect_audio: [
    'AUDIOの全PACKETを確認する。',
    'まだ聞いていない台詞を探す。',
    'PACKET 04を再生する。',
  ],
  analyze_voice: [
    '端末横のパネルを調べる。',
    'ロッカーのドライバーを使う。',
    'VOICE ANALYSISをONにする。',
  ],
  transmit_packets: [
    '冒頭の会話を思い出す。',
    'PACKET 01〜04の内容を再現する。',
    '聞こえるか、電源、ログ、赤いボタンの順。',
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
    '現在の目的を確認しよう。',
    '重要な情報を再確認しよう。',
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
