const lines = [
  ['主人公', '……何だ、ここ……。'],
  ['謎の声', '……聞こえるか？'],
  ['主人公', '誰だ？'],
  ['謎の声', '隣の実験室にいる。こっちも閉じ込められてる。'],
  ['謎の声', 'でも――そっちの部屋なら出口を開けられる。'],
  ['主人公', 'どうして分かる？'],
  ['謎の声', '説明してる時間がない。まず電源を戻せ。'],
] as const;

type Props = { lineIndex: number; onAdvance: () => void };

export function IntroDialogue({ lineIndex, onAdvance }: Props) {
  const line = lines[Math.min(lineIndex, lines.length - 1)] ?? lines[0];
  return (
    <section className="dialogue-overlay" aria-live="polite" aria-label="会話">
      <span className="speaker">{line[0]}</span>
      <p>{line[1]}</p>
      <button type="button" onClick={onAdvance} autoFocus>
        {lineIndex >= lines.length - 1 ? '探索を始める' : '次へ'}
      </button>
    </section>
  );
}
