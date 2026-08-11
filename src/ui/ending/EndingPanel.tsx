const lines = [
  'PACKET 01 SENT / PACKET 02 SENT / PACKET 03 SENT / PACKET 04 SENT',
  '過去の主人公「……何だ、ここ……。誰だ？」',
  '主人公「隣の実験室にいる。こっちも閉じ込められてる。」',
  '主人公「でも――そっちの部屋なら出口を開けられる。」',
  '過去の主人公「どうして分かる？」',
  '主人公「説明してる時間がない。まず電源を戻せ。」',
];

export function EndingPanel({
  lineIndex,
  completed,
  onAdvance,
}: {
  lineIndex: number;
  completed: boolean;
  onAdvance: () => void;
}) {
  return (
    <section
      className={completed ? 'ending-panel is-complete' : 'ending-panel'}
      aria-live="polite"
    >
      {completed ? (
        <>
          <h1>ECHO ROOM</h1>
          <p>TRANSMISSION COMPLETE</p>
        </>
      ) : (
        <>
          <p>{lines[lineIndex]}</p>
          <button type="button" onClick={onAdvance}>
            {lineIndex === lines.length - 1 ? 'ドアを開ける' : '続ける'}
          </button>
        </>
      )}
    </section>
  );
}
